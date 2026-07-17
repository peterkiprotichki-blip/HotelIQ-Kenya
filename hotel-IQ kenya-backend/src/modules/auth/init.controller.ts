import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ALL_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_AGENT_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_TENANT_PERMISSIONS,
  Permission,
  RentiumUserRole,
} from './schemas/rentium-user.schema';

interface SeedUserConfig {
  name: string;
  email: string;
  password: string;
  role: RentiumUserRole;
  permissions?: Permission[];
}

interface SeedRequestBody {
  users?: SeedUserConfig[];
}

@Controller('init')
export class InitController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase(@Body() body?: SeedRequestBody) {
    const users = this.getSeedUsers(body?.users);

    const seededUsers = [];
    for (const user of users) {
      const permissions = user.permissions?.length ? user.permissions : this.getDefaultPermissions(user.role);
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const existing = await this.prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        await this.prisma.user.update({
          where: { email: user.email },
          data: {
            name: user.name,
            password: hashedPassword,
            role: user.role,
            permissions,
            isActive: true,
            isApproved: true,
            isEmailVerified: true,
            isDeleted: false,
          },
        });

        seededUsers.push({
          email: user.email,
          role: user.role,
          status: 'updated',
        });
        continue;
      }

      await this.prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          permissions,
          isActive: true,
          isApproved: true,
          isEmailVerified: true,
        },
      });

      seededUsers.push({
        email: user.email,
        role: user.role,
        status: 'created',
      });
    }

    return {
      success: true,
      message: 'Database seeded successfully',
      users: seededUsers,
    };
  }

  private getSeedUsers(bodyUsers?: SeedUserConfig[]): SeedUserConfig[] {
    if (Array.isArray(bodyUsers) && bodyUsers.length) {
      return this.validateSeedUsers(bodyUsers);
    }

    const raw = process.env.SEED_USERS_JSON || '';
    if (!raw.trim()) {
      throw new BadRequestException(
        'Missing seed users. Provide users in request body or set SEED_USERS_JSON.',
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('SEED_USERS_JSON must be valid JSON.');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new BadRequestException('SEED_USERS_JSON must be a non-empty JSON array.');
    }

    return this.validateSeedUsers(parsed as SeedUserConfig[]);
  }

  private validateSeedUsers(users: SeedUserConfig[]): SeedUserConfig[] {
    if (!Array.isArray(users) || users.length === 0) {
      throw new BadRequestException('Seed users must be a non-empty array.');
    }

    const allowedRoles = new Set(Object.values(RentiumUserRole));
    const allowedPermissions = new Set(ALL_PERMISSIONS);

    return users.map((item, index) => {
      const row = item as Partial<SeedUserConfig>;

      if (!row?.name || !row?.email || !row?.password || !row?.role) {
        throw new BadRequestException(
          `Seed user at index ${index} must include name, email, password, and role.`,
        );
      }

      if (!allowedRoles.has(row.role)) {
        throw new BadRequestException(
          `Invalid role "${String(row.role)}" at index ${index}.`,
        );
      }

      const normalizedPermissions = Array.isArray(row.permissions)
        ? row.permissions.filter((permission) => allowedPermissions.has(permission as Permission))
        : undefined;

      if (Array.isArray(row.permissions) && normalizedPermissions?.length !== row.permissions.length) {
        throw new BadRequestException(
          `Invalid permission value found for user at index ${index}.`,
        );
      }

      return {
        name: String(row.name).trim(),
        email: String(row.email).trim().toLowerCase(),
        password: String(row.password),
        role: row.role,
        permissions: normalizedPermissions,
      };
    });
  }

  private getDefaultPermissions(role: RentiumUserRole): Permission[] {
    if (role === RentiumUserRole.admin || role === RentiumUserRole.super_admin) {
      return [...DEFAULT_ADMIN_PERMISSIONS];
    }

    if (role === RentiumUserRole.manager) {
      return [...DEFAULT_MANAGER_PERMISSIONS];
    }

    if (role === RentiumUserRole.tenant) {
      return [...DEFAULT_TENANT_PERMISSIONS];
    }

    return [...DEFAULT_AGENT_PERMISSIONS];
  }
}
