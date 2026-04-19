import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TenantPortalJwtGuard extends AuthGuard('tenant-portal-jwt') {}
