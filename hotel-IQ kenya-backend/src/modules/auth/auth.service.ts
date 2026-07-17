import {
  BadRequestException,
  ConflictException,
  forwardRef,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_AGENT_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_TENANT_PERMISSIONS,
  Permission,
  RentiumUserRole,
} from './schemas/rentium-user.schema';
import { RegisterDto, LoginDto, UpdateUserDto, InviteUserDto } from './dto/auth.dto';
import { EmailService } from './email.service';
import { PropertiesService } from '../properties/properties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord, mapRecords, stripPassword } from '../../prisma/prisma-mappers';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => PropertiesService)) private readonly propertiesService: PropertiesService,
  ) {}

  async register(dto: RegisterDto, tenantId?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const role = dto.role || RentiumUserRole.agent;
    const permissions = dto.permissions?.length ? dto.permissions : this.getDefaultPermissions(role);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        role,
        permissions,
        isEmailVerified: true,
        isApproved: true,
        isActive: true,
        tenantIds: tenantId ? [tenantId] : [],
        activeTenantId: tenantId || '',
      },
    });

    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const { user: normalizedUser, tenants, activeTenantId } = await this.getTenantContext(user);
    const token = this.generateToken(normalizedUser);

    return {
      user: this.sanitizeUser(normalizedUser),
      token,
      tenants: mapRecords(tenants),
      activeTenantId,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('User not found');
    }

    const { user: normalizedUser, tenants, activeTenantId } = await this.getTenantContext(user);
    return {
      ...this.sanitizeUser(normalizedUser),
      tenants: mapRecords(tenants),
      activeTenantId,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string, tenantId?: string) {
    const where: any = { isDeleted: false };

    if (tenantId) {
      where.tenantIds = { has: tenantId };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: mapRecords(data).map((user) => this.sanitizeUser(user as any)),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string, requester: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    this.assertUserAccessible(user, requester);
    return this.sanitizeUser(user);
  }

  async updateUser(id: string, dto: UpdateUserDto, requester: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    this.assertUserAccessible(user, requester);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role && !dto.permissions) {
      updateData.permissions = this.getDefaultPermissions(dto.role);
    }

    if (dto.tenantIds) {
      updateData.tenantIds = [...new Set(dto.tenantIds.filter(Boolean))];
    }

    if (dto.activeTenantId !== undefined) {
      updateData.activeTenantId = dto.activeTenantId;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { user: normalizedUser } = await this.ensureActiveTenant(updated);
    return this.sanitizeUser(normalizedUser);
  }

  async deleteUser(id: string, requester: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    this.assertUserAccessible(user, requester);

    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return { message: 'User deleted successfully' };
  }

  async inviteUser(dto: InviteUserDto, tenantId: string) {
    const requestedTenantIds = Array.isArray(dto.tenantIds) ? dto.tenantIds.filter(Boolean) : [];
    const normalizedTenantIds = [...new Set([...(tenantId ? [tenantId] : []), ...requestedTenantIds])];
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (existing) {
      const tenantIds = [...new Set([...(existing.tenantIds || []), ...normalizedTenantIds])];
      const permissions = dto.permissions?.length
        ? dto.permissions
        : dto.role
          ? this.getDefaultPermissions(dto.role)
          : existing.permissions;

      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          tenantIds,
          role: dto.role || existing.role,
          permissions,
          ...(dto.password ? { password: await bcrypt.hash(dto.password, 10) } : {}),
          isActive: true,
          isApproved: true,
          isEmailVerified: true,
        },
      });

      const { user } = await this.ensureActiveTenant(updated);
      return this.sanitizeUser(user);
    }

    const role = dto.role || RentiumUserRole.agent;
    const permissions = dto.permissions?.length ? dto.permissions : this.getDefaultPermissions(role);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password ? await bcrypt.hash(dto.password, 10) : '',
        role,
        permissions,
        isEmailVerified: true,
        isApproved: true,
        isActive: true,
        tenantIds: normalizedTenantIds,
        activeTenantId: normalizedTenantIds[0] || '',
      },
    });

    const { user: normalizedUser } = await this.ensureActiveTenant(user);
    return this.sanitizeUser(normalizedUser);
  }

  async setPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(password, 10) },
    });

    return { message: 'Password set successfully' };
  }

  async guestSignup(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        role: RentiumUserRole.tenant,
        permissions: this.getDefaultPermissions(RentiumUserRole.tenant),
        isEmailVerified: true,
        isApproved: true,
        isActive: true,
      },
    });

    return this.login({ email: dto.email, password: dto.password });
  }

  async signup(dto: { name: string; email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        role: RentiumUserRole.agent,
        permissions: DEFAULT_AGENT_PERMISSIONS,
        isEmailVerified: false,
        isApproved: false,
        isActive: true,
        verificationToken,
      },
    });

    await this.emailService.sendVerificationEmail(dto.email, dto.name, verificationToken);
    return { message: 'Signup successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { verificationToken: token, isDeleted: false } });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verificationToken: '' },
    });

    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [RentiumUserRole.admin, RentiumUserRole.super_admin] },
        isActive: true,
        isDeleted: false,
      },
    });

    for (const admin of admins) {
      await this.emailService.sendNewUserNotificationToAdmin(admin.email, user.name, user.email);
    }

    return { message: 'Email verified. An administrator will review your account.' };
  }

  async googleLogin(googleUser: any) {
    if (!googleUser) {
      return { error: 'auth_failed', message: 'Google authentication failed' };
    }

    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: googleUser.name || `${googleUser.firstName || ''} ${googleUser.lastName || ''}`.trim(),
          email: googleUser.email,
          googleId: googleUser.googleId,
          avatar: googleUser.picture || '',
          authProvider: 'google',
          isEmailVerified: true,
          isApproved: false,
          isActive: true,
          role: RentiumUserRole.agent,
          permissions: DEFAULT_AGENT_PERMISSIONS,
        },
      });

      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: [RentiumUserRole.admin, RentiumUserRole.super_admin] },
          isActive: true,
          isDeleted: false,
        },
      });

      for (const admin of admins) {
        await this.emailService.sendNewUserNotificationToAdmin(admin.email, user.name, user.email);
      }

      return { error: 'pending_approval', message: 'Account created. Awaiting administrator approval.' };
    }

    if (!user.isApproved) {
      return { error: 'pending_approval', message: 'Your account is awaiting administrator approval.' };
    }

    if (!user.isActive) {
      return { error: 'account_disabled', message: 'Your account has been deactivated.' };
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId || googleUser.googleId,
        authProvider: 'google',
        avatar: googleUser.picture || user.avatar,
      },
    });

    const { user: normalizedUser, tenants, activeTenantId } = await this.getTenantContext(updated);
    return {
      token: this.generateToken(normalizedUser),
      user: this.sanitizeUser(normalizedUser),
      tenants: mapRecords(tenants),
      activeTenantId,
    };
  }

  async approveUser(id: string, requester: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    this.assertUserAccessible(user, requester);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isApproved: true, isActive: true },
    });

    await this.emailService.sendApprovalNotification(updated.email, updated.name);
    return this.sanitizeUser(updated);
  }

  async rejectUser(id: string, requester: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    this.assertUserAccessible(user, requester);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isApproved: false, isActive: false },
    });

    return this.sanitizeUser(updated);
  }

  async searchAllUsers(query: string, requester: any) {
    const where: any = {
      isDeleted: false,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (requester.role !== RentiumUserRole.super_admin) {
      where.tenantIds = { has: requester.tenantId };
    }

    const users = await this.prisma.user.findMany({
      where,
      take: 20,
      orderBy: { name: 'asc' },
    });

    return mapRecords(users).map((user) => this.sanitizeUser(user as any));
  }

  async getTenantMembers(tenantId: string, requester: any) {
    this.assertTenantAccess(tenantId, requester);
    const users = await this.prisma.user.findMany({
      where: { tenantIds: { has: tenantId }, isDeleted: false },
      orderBy: { name: 'asc' },
    });

    return mapRecords(users).map((user) => this.sanitizeUser(user as any));
  }

  async switchTenant(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const { tenants } = await this.ensureActiveTenant(user);
    const canAccessTenant = tenants.some((tenant) => tenant._id === tenantId);
    if (!canAccessTenant) {
      throw new BadRequestException('User does not belong to this tenant');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { activeTenantId: tenantId },
    });

    const { user: normalizedUser, tenants: refreshedTenants, activeTenantId } = await this.getTenantContext(updated);
    return {
      token: this.generateToken(normalizedUser),
      user: this.sanitizeUser(normalizedUser),
      tenants: mapRecords(refreshedTenants),
      activeTenantId,
    };
  }

  async addUserToTenant(userId: string, tenantId: string, requester: any) {
    this.assertTenantAccess(tenantId, requester);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const tenantIds = [...new Set([...(user.tenantIds || []), tenantId])];
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { tenantIds },
    });

    const { user: normalizedUser } = await this.ensureActiveTenant(updated);
    return this.sanitizeUser(normalizedUser);
  }

  async removeUserFromTenant(userId: string, tenantId: string, requester: any) {
    this.assertTenantAccess(tenantId, requester);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const tenantIds = (user.tenantIds || []).filter((id) => id !== tenantId);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { tenantIds },
    });

    const { user: normalizedUser } = await this.ensureActiveTenant(updated);
    return this.sanitizeUser(normalizedUser);
  }

  private getDefaultPermissions(role: RentiumUserRole): Permission[] {
    switch (role) {
      case RentiumUserRole.admin:
      case RentiumUserRole.super_admin:
        return [...DEFAULT_ADMIN_PERMISSIONS];
      case RentiumUserRole.manager:
        return [...DEFAULT_MANAGER_PERMISSIONS];
      case RentiumUserRole.tenant:
        return [...DEFAULT_TENANT_PERMISSIONS];
      default:
        return [...DEFAULT_AGENT_PERMISSIONS];
    }
  }

  private generateToken(user: any): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantIds: user.tenantIds || [],
      tenantId: user.activeTenantId || '',
    });
  }

  private async resolveAccessibleTenants(user: any) {
    if (user.role === RentiumUserRole.super_admin || user.role === RentiumUserRole.admin) {
      const properties = await this.prisma.property.findMany({ where: { isActive: true } });
      return mapRecords(properties);
    }

    try {
      const property = await this.propertiesService.findByOwnerId(user.id);
      return [property];
    } catch {
      return [];
    }
  }

  private async ensureActiveTenant(user: any) {
    const accessibleTenants = await this.resolveAccessibleTenants(user);
    const accessibleIds = accessibleTenants.map((tenant) => tenant.id);
    let activeTenantId = user.activeTenantId || '';

    if (!accessibleIds.length) {
      activeTenantId = '';
    } else if (!accessibleIds.includes(activeTenantId)) {
      activeTenantId = accessibleIds[0];
    }

    let normalizedUser = user;
    if (activeTenantId !== (user.activeTenantId || '')) {
      normalizedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { activeTenantId },
      });
    }

    return { user: normalizedUser, tenants: accessibleTenants, activeTenantId };
  }

  private async getTenantContext(user: any) {
    return this.ensureActiveTenant(user);
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = stripPassword(user);
    return mapRecord(rest);
  }

  private assertTenantAccess(tenantId: string, requester: any) {
    if (requester.role === RentiumUserRole.super_admin) {
      return;
    }

    if (requester.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  private assertUserAccessible(user: any, requester: any) {
    if (requester.role === RentiumUserRole.super_admin) {
      return;
    }

    if (!user.tenantIds?.includes(requester.tenantId)) {
      throw new ForbiddenException('You do not have access to this user');
    }
  }
}
