import { TenantPlan } from '@prisma/client';

export { TenantPlan };

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logoUrl: string;
  isActive: boolean;
  plan: TenantPlan;
  settings: Record<string, any> | null;
  ownerUserId: string;
  contactEmail: string;
  billingEmail: string;
  maxUsers: number;
  maxProperties: number;
  mpesaClientId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
