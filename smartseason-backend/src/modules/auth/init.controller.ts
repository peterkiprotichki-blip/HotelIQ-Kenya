import { BadRequestException, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RentiumUserRole } from './schemas/rentium-user.schema';

interface SeedUserConfig {
  name: string;
  email: string;
  password: string;
  role: RentiumUserRole;
}

@Controller('init')
export class InitController {
  constructor(private readonly authService: AuthService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase() {
    const users = this.getSeedUsersFromEnv();

    const seededUsers = [];
    for (const user of users) {
      try {
        await this.authService.register({
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role as RentiumUserRole,
        });

        seededUsers.push({
          email: user.email,
          role: user.role,
          status: 'created',
        });
      } catch (error) {
        // Keep seed idempotent: if a user already exists, continue with the rest.
        seededUsers.push({
          email: user.email,
          role: user.role,
          status: 'skipped',
        });
      }
    }

    return {
      success: true,
      message: 'Database seeded successfully from environment configuration',
      users: seededUsers,
    };
  }

  private getSeedUsersFromEnv(): SeedUserConfig[] {
    const raw = process.env.SEED_USERS_JSON || '';
    if (!raw.trim()) {
      throw new BadRequestException(
        'Missing SEED_USERS_JSON. Provide a JSON array of users to seed.',
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

    return parsed.map((item, index) => {
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

      return {
        name: String(row.name).trim(),
        email: String(row.email).trim().toLowerCase(),
        password: String(row.password),
        role: row.role,
      };
    });
  }
}
