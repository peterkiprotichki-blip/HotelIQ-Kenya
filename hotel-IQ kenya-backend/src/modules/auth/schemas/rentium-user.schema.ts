import { Permission, RentiumUserRole } from '@prisma/client';

export { Permission, RentiumUserRole };

export const ALL_PERMISSIONS = Object.values(Permission);

export const DEFAULT_ADMIN_PERMISSIONS = [...ALL_PERMISSIONS];

export const DEFAULT_MANAGER_PERMISSIONS = [
  Permission.view_dashboard,
  Permission.view_properties,
  Permission.create_properties,
  Permission.edit_properties,
  Permission.view_tenants,
  Permission.create_tenants,
  Permission.edit_tenants,
  Permission.view_leases,
  Permission.create_leases,
  Permission.edit_leases,
  Permission.view_payments,
  Permission.create_payments,
  Permission.edit_payments,
  Permission.view_damages,
  Permission.create_damages,
  Permission.edit_damages,
  Permission.view_reports,
  Permission.export_reports,
  Permission.view_users,
];

export const DEFAULT_AGENT_PERMISSIONS = [
  Permission.view_dashboard,
  Permission.view_properties,
  Permission.view_tenants,
  Permission.view_leases,
  Permission.view_payments,
  Permission.create_payments,
  Permission.view_damages,
  Permission.create_damages,
  Permission.view_reports,
];

export const DEFAULT_TENANT_PERMISSIONS = [
  Permission.view_dashboard,
  Permission.view_leases,
  Permission.sign_lease,
  Permission.view_payments,
  Permission.view_damages,
  Permission.create_damages,
  Permission.create_maintenance_requests,
  Permission.view_maintenance_requests,
  Permission.edit_maintenance_requests,
];

export interface RentiumUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: RentiumUserRole;
  isActive: boolean;
  assignedPropertyIds: string[];
  permissions: Permission[];
  googleId: string;
  avatar: string;
  phone: string;
  isEmailVerified: boolean;
  verificationToken: string;
  isApproved: boolean;
  authProvider: 'credentials' | 'google' | 'local';
  tenantIds: string[];
  activeTenantId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
