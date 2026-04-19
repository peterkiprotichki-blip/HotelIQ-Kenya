import { Component, OnInit } from '@angular/core';
import { TenantsService } from '../../shared/services/tenants/tenants.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { UsersService } from '../../shared/services/users/users.service';
import { Tenant, BomoproUser } from '../../shared/interfaces/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-system-tenants',
  templateUrl: './system-tenants.component.html',
  styleUrls: ['./system-tenants.component.scss'],
})
export class SystemTenantsComponent implements OnInit {
  tenants: Tenant[] = [];
  loading = true;
  showForm = false;
  showMembers = false;
  editing: Tenant | null = null;
  selectedTenant: Tenant | null = null;
  saving = false;
  memberActionInProgress = false;
  searchingUsers = false;
  form: Partial<Tenant> = {};
  tenantMembers: Record<string, BomoproUser[]> = {};
  memberSearch = '';
  searchResults: BomoproUser[] = [];

  plans = ['free', 'basic', 'pro', 'enterprise'];

  constructor(
    private tenantsService: TenantsService,
    private usersService: UsersService,
    private authService: AuthService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void { this.loadTenants(); }

  loadTenants(): void {
    this.loading = true;
    this.tenantsService.getAll().subscribe({
      next: (t: Tenant[]) => {
        this.tenants = t;
        this.authService.setTenantContext(t, this.authService.getActiveTenantId());
        this.loading = false;
        this.loadTenantMembers();
      },
      error: () => { this.loading = false; },
    });
  }

  openForm(tenant?: Tenant): void {
    this.editing = tenant || null;
    this.form = tenant ? { ...tenant } : { name: '', slug: '', contactEmail: '', plan: 'free', isActive: true, maxUsers: 10, maxProperties: 50 };
    this.showForm = true;
  }

  save(): void {
    if (!this.form.name) return;
    this.saving = true;
    const obs = this.editing
      ? this.tenantsService.update(this.editing._id, this.form)
      : this.tenantsService.create(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.loadTenants(); },
      error: () => { this.saving = false; },
    });
  }

  deleteTenant(id: string): void {
    if (!confirm('Delete this organization?')) return;
    this.tenantsService.delete(id).subscribe(() => this.loadTenants());
  }

  openMembers(tenant: Tenant): void {
    this.selectedTenant = tenant;
    this.memberSearch = '';
    this.searchResults = [];
    this.showMembers = true;

    if (!this.tenantMembers[tenant._id]) {
      this.usersService.getTenantMembers(tenant._id).subscribe((members) => {
        this.tenantMembers[tenant._id] = members;
      });
    }
  }

  searchUsers(): void {
    if (!this.memberSearch.trim()) {
      this.searchResults = [];
      return;
    }

    this.searchingUsers = true;
    this.usersService.searchAll(this.memberSearch).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.searchingUsers = false;
      },
      error: () => {
        this.searchingUsers = false;
      },
    });
  }

  addUserToTenant(user: BomoproUser): void {
    if (!this.selectedTenant) {
      return;
    }

    this.memberActionInProgress = true;
    this.usersService.addToTenant(user._id, this.selectedTenant._id).subscribe({
      next: (updatedUser) => {
        this.memberActionInProgress = false;
        const members = this.getMembers(this.selectedTenant!._id);
        if (!members.some((member) => member._id === updatedUser._id)) {
          this.tenantMembers[this.selectedTenant!._id] = [updatedUser, ...members];
        }
        this.searchResults = this.searchResults.filter((result) => result._id !== updatedUser._id);
      },
      error: () => {
        this.memberActionInProgress = false;
      },
    });
  }

  removeUserFromTenant(user: BomoproUser): void {
    if (!this.selectedTenant || !confirm(`Remove ${user.name} from ${this.selectedTenant.name}?`)) {
      return;
    }

    this.memberActionInProgress = true;
    this.usersService.removeFromTenant(user._id, this.selectedTenant._id).subscribe({
      next: () => {
        this.memberActionInProgress = false;
        this.tenantMembers[this.selectedTenant!._id] = this.getMembers(this.selectedTenant!._id).filter((member) => member._id !== user._id);
      },
      error: () => {
        this.memberActionInProgress = false;
      },
    });
  }

  getMembers(tenantId: string): BomoproUser[] {
    return this.tenantMembers[tenantId] || [];
  }

  isUserLinkedToSelectedTenant(user: BomoproUser): boolean {
    if (!this.selectedTenant) {
      return false;
    }

    return this.getMembers(this.selectedTenant._id).some((member) => member._id === user._id);
  }

  private loadTenantMembers(): void {
    if (!this.tenants.length) {
      this.tenantMembers = {};
      return;
    }

    const requests = this.tenants.reduce<Record<string, ReturnType<UsersService['getTenantMembers']>>>((acc, tenant) => {
      acc[tenant._id] = this.usersService.getTenantMembers(tenant._id);
      return acc;
    }, {});

    forkJoin(requests).subscribe({
      next: (members) => {
        this.tenantMembers = members;
      },
      error: () => {
        this.tenantMembers = {};
      },
    });
  }

  getPlanClasses(plan: string): string {
    const map: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400',
      basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      enterprise: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return map[plan] || '';
  }
}
