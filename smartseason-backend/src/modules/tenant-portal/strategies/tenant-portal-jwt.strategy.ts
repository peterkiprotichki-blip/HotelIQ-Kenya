import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class TenantPortalJwtStrategy extends PassportStrategy(Strategy, 'tenant-portal-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.TENANT_PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'bomapro-portal-secret',
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'tenant-portal') {
      throw new UnauthorizedException('Invalid token type');
    }
    return {
      sub: payload.sub,          // PropertyTenant _id
      email: payload.email,
      name: payload.name,
      orgTenantId: payload.orgTenantId, // the Bomapro organization tenantId
    };
  }
}
