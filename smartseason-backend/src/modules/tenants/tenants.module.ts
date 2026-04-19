import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { TenantRepository } from './repositories/tenant.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
    forwardRef(() => AuthModule),
  ],
  controllers: [TenantsController],
  providers: [TenantsService, TenantRepository],
  exports: [TenantsService, TenantRepository],
})
export class TenantsModule {}
