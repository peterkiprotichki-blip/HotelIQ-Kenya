import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { InitController } from './init.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailService } from './email.service';
import { PropertiesModule } from '../properties/properties.module';

const googleOAuthProviders =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [GoogleStrategy]
    : [];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'smartseason-secret-change-me',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    forwardRef(() => PropertiesModule),
  ],
  controllers: [AuthController, InitController],
  providers: [AuthService, JwtStrategy, ...googleOAuthProviders, EmailService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
