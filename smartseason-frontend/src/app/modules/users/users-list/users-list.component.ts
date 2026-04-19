import { Component, OnInit } from '@angular/core';
import { UsersService, SaveUserPayload } from '../../../shared/services/users/users.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { BomoproUser, PermissionsResponse, Tenant } from '../../../shared/interfaces/models';

type UserRole = BomoproUser['role'];

interface UserFormModel {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  isActive: boolean;
  tenantIds: string[];
}

interface RoleOption {
  value: UserRole;
  label: string;
}

const SMARTSEASON_PERMISSIONS = [
  'view_dashboard',
  'view_properties',
  'create_properties',
  'edit_properties',
  'delete_properties',
  'view_reports',
  'export_reports',
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
] as const;

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  users: BomoproUser[] = [];
  loading = true;
  search = '';
  showUserForm = false;
  showPermissions = false;
  savingUser = false;
  savingPermissions = false;
  editingUser: BomoproUser | null = null;
  selectedUserForPermissions: BomoproUser | null = null;
  organizations: Tenant[] = [];
  roleOptions: RoleOption[] = [
    { value: 'admin', label: 'Admin (Coordinator)' },
    { value: 'agent', label: 'Field Agent' },
  ];
  permissionsData: PermissionsResponse | null = null;
  permissionDraft: string[] = [];

  userForm: UserFormModel = this.createEmptyForm();

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.organizations = this.authService.getTenants();
    this.loadUsers();
    this.usersService.getPermissions().subscribe((p) => (this.permissionsData = p));
    this.authService.tenantList$.subscribe((tenants: Tenant[]) => {
      this.organizations = tenants;
      this.userForm.tenantIds = this.userForm.tenantIds.filter((tenantId) => tenants.some((tenant: Tenant) => tenant._id === tenantId));
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getAll(1, 50, this.search).subscribe({
      next: (res) => { this.users = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onSearch(): void {
    this.loadUsers();
  }

  openCreate(): void {
    this.editingUser = null;
    this.userForm = this.createEmptyForm();
    this.showUserForm = true;
  }

  openEdit(user: BomoproUser): void {
    this.editingUser = user;
    this.userForm = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: this.normalizeRole(user.role),
      password: '',
      isActive: user.isActive,
      tenantIds: [...(user.tenantIds || [])],
    };
    this.showUserForm = true;
  }

  saveUser(): void {
    if (!this.userForm.name || !this.userForm.email) {
      return;
    }

    if (!this.editingUser && !this.userForm.password) {
      return;
    }

    if (!this.userForm.tenantIds.length && this.organizations.length) {
      return;
    }

    const payload: SaveUserPayload = {
      name: this.userForm.name.trim(),
      email: this.userForm.email.trim(),
      phone: this.userForm.phone.trim(),
      role: this.userForm.role,
      isActive: this.userForm.isActive,
      tenantIds: [...new Set(this.userForm.tenantIds)],
    };

    if (this.userForm.password.trim()) {
      payload.password = this.userForm.password.trim();
    }

    this.savingUser = true;
    const request = this.editingUser
      ? this.usersService.update(this.editingUser._id, payload)
      : this.usersService.create(payload);

    request.subscribe({
      next: () => {
        this.savingUser = false;
        this.showUserForm = false;
        this.loadUsers();
      },
      error: () => {
        this.savingUser = false;
      },
    });
  }

  approve(userId: string): void {
    this.usersService.approve(userId).subscribe(() => this.loadUsers());
  }

  reject(userId: string): void {
    if (!confirm('Reject this user?')) return;
    this.usersService.reject(userId).subscribe(() => this.loadUsers());
  }

  deleteUser(userId: string): void {
    if (!confirm('Delete this user?')) return;
    this.usersService.delete(userId).subscribe(() => this.loadUsers());
  }

  openPermissionsModal(user: BomoproUser): void {
    this.selectedUserForPermissions = user;
    const allowed = new Set(SMARTSEASON_PERMISSIONS);
    this.permissionDraft = [...(user.permissions || [])].filter((permission) => allowed.has(permission as any));
    this.showPermissions = true;
  }

  togglePermission(permission: string): void {
    const index = this.permissionDraft.indexOf(permission);
    if (index > -1) {
      this.permissionDraft.splice(index, 1);
      return;
    }

    this.permissionDraft.push(permission);
  }

  savePermissions(): void {
    if (!this.selectedUserForPermissions) {
      return;
    }

    this.savingPermissions = true;
    const allowed = new Set(SMARTSEASON_PERMISSIONS);
    const normalizedPermissions = [...this.permissionDraft].filter((permission) => allowed.has(permission as any));

    this.usersService.update(this.selectedUserForPermissions._id, { permissions: normalizedPermissions as any }).subscribe({
      next: () => {
        this.savingPermissions = false;
        this.showPermissions = false;
        this.loadUsers();
      },
      error: () => {
        this.savingPermissions = false;
      },
    });
  }

  toggleOrganization(tenantId: string): void {
    const current = new Set(this.userForm.tenantIds);
    if (current.has(tenantId)) {
      current.delete(tenantId);
    } else {
      current.add(tenantId);
    }
    this.userForm.tenantIds = [...current];
  }

  getUserOrganizations(user: BomoproUser): Tenant[] {
    const ids = new Set(user.tenantIds || []);
    return this.organizations.filter((tenant) => ids.has(tenant._id));
  }

  isOrganizationSelected(tenantId: string): boolean {
    return this.userForm.tenantIds.includes(tenantId);
  }

  trackByUser(index: number, user: BomoproUser): string {
    return user._id;
  }

  getRoleClasses(role: string): string {
    const map: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      agent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return map[role] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200';
  }

  getRoleLabel(role: string): string {
    if (role === 'admin') {
      return 'Admin (Coordinator)';
    }

    if (role === 'agent') {
      return 'Field Agent';
    }

    return role.replace('_', ' ');
  }

  getPermissionLabel(permission: string): string {
    const normalized = permission;
    const [actionRaw, ...resourceParts] = normalized.split('_');
    const actionMap: Record<string, string> = {
      view: 'View',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      sign: 'Sign',
      export: 'Export',
    };

    const resourceKey = resourceParts.join('_');
    const resourceMap: Record<string, string> = {
      dashboard: 'Dashboard',
      properties: 'Fields',
      reports: 'Reports',
      users: 'Users',
    };

    const action = actionMap[actionRaw] || this.toTitleCase(actionRaw);
    const resource = resourceMap[resourceKey] || this.toTitleCase(resourceKey.replace(/_/g, ' '));
    return `${action} ${resource}`.trim();
  }

  getPermissionContext(permission: string): string {
    const normalized = permission;
    const contextMap: Record<string, string> = {
      view_properties: 'Open and list crop fields',
      create_properties: 'Create new crop fields',
      edit_properties: 'Update field details',
      delete_properties: 'Remove fields from active records',
      view_dashboard: 'See overview metrics and status summaries',
      view_reports: 'Open field reports and trends',
      export_reports: 'Export reporting data',
      view_users: 'View user list and profiles',
      create_users: 'Create new system users',
      edit_users: 'Update existing user details',
      delete_users: 'Remove users from the system',
    };

    return contextMap[normalized] || 'Controls access to this feature.';
  }

  private toTitleCase(value: string): string {
    if (!value) {
      return '';
    }

    return value
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private createEmptyForm(): UserFormModel {
    return {
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      password: '',
      isActive: true,
      tenantIds: this.getDefaultTenantIds(),
    };
  }

  private normalizeRole(role: string): UserRole {
    if (role === 'admin' || role === 'agent') {
      return role;
    }

    return 'agent';
  }

  get availablePermissions(): string[] {
    if (!this.permissionsData?.all?.length) {
      return [];
    }

    const allowed = new Set(SMARTSEASON_PERMISSIONS);
    return this.permissionsData.all.filter((permission) => allowed.has(permission as any));
  }

  private getDefaultTenantIds(): string[] {
    const activeTenantId = this.authService.getActiveTenantId();
    if (activeTenantId) {
      return [activeTenantId];
    }

    if (this.organizations.length === 1) {
      return [this.organizations[0]._id];
    }

    return [];
  }
}
