import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import {
  ALL_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_AGENT_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_TENANT_PERMISSIONS,
  Permission,
  RentiumUser,
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
  constructor(
    private readonly authService: AuthService,
    @InjectModel(RentiumUser.name)
    private readonly userModel: Model<RentiumUser>,
  ) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase(@Body() body?: SeedRequestBody) {
    const users = this.getSeedUsers(body?.users);

    const seededUsers = [];
    for (const user of users) {
      const permissions = user.permissions?.length
        ? user.permissions
        : this.getDefaultPermissions(user.role);

      const existing = await this.userModel.findOne({ email: user.email });
      if (existing) {
        existing.name = user.name;
        existing.password = await bcrypt.hash(user.password, 10);
        existing.role = user.role;
        existing.permissions = permissions;
        existing.isActive = true;
        existing.isApproved = true;
        existing.isEmailVerified = true;
        await existing.save();

        seededUsers.push({
          email: user.email,
          role: user.role,
          status: 'updated',
        });
        continue;
      }

      await this.authService.register({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        permissions,
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

    const allowedRoles = new Set(Object.values(RentiumUserRole));

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
    if (role === RentiumUserRole.ADMIN || role === RentiumUserRole.SUPER_ADMIN) {
      return [...DEFAULT_ADMIN_PERMISSIONS];
    }

    if (role === RentiumUserRole.MANAGER) {
      return [...DEFAULT_MANAGER_PERMISSIONS];
    }

    if (role === RentiumUserRole.TENANT) {
      return [...DEFAULT_TENANT_PERMISSIONS];
    }

    return [...DEFAULT_AGENT_PERMISSIONS];
  }
}
