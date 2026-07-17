import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthResponse, BomoproUser, Tenant } from '../../interfaces/models';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly tokenKey = 'smartseason_token';
  private readonly userKey = 'smartseason_user';
  private readonly tenantsKey = 'smartseason_tenants';
  private readonly activeTenantKey = 'smartseason_active_tenant';

  private readonly userSubject = new BehaviorSubject<BomoproUser | null>(null);
  private readonly tenantsSubject = new BehaviorSubject<Tenant[]>([]);
  private readonly activeTenantIdSubject = new BehaviorSubject<string>('');

  readonly user$ = this.userSubject.asObservable();
  readonly tenantList$ = this.tenantsSubject.asObservable();
  readonly currentTenantId$ = this.activeTenantIdSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.loadFromStorage();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        this.persistSession(res.token, res.user, res.tenants || [], res.activeTenantId || '');
      }),
    );
  }

  signup(name: string, email: string, password: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/signup`, { name, email, password });
  }

  guestSignup(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/guest/signup`, { name, email, password }).pipe(
      tap((res) => {
        this.persistSession(res.token, res.user, res.tenants || [], res.activeTenantId || '');
      }),
    );
  }

  verifyEmail(token: string): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/verify-email`, { params: { token } });
  }

  googleLogin(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  handleGoogleCallback(token: string, user: BomoproUser, tenants: Tenant[] = [], activeTenantId = ''): void {
    this.persistSession(token, user, tenants, activeTenantId);
  }

  switchTenant(tenantId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/switch-tenant`, { tenantId }).pipe(
      tap((res) => {
        this.persistSession(res.token, res.user, res.tenants || this.tenantsSubject.value, res.activeTenantId || tenantId);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tenantsKey);
    localStorage.removeItem(this.activeTenantKey);

    this.userSubject.next(null);
    this.tenantsSubject.next([]);
    this.activeTenantIdSubject.next('');
  }

  getToken(): string {
    return localStorage.getItem(this.tokenKey) || '';
  }

  getUser(): BomoproUser | null {
    return this.userSubject.value;
  }

  getTenants(): Tenant[] {
    return this.tenantsSubject.value;
  }

  getActiveTenantId(): string {
    return this.activeTenantIdSubject.value;
  }

  setTenantContext(tenants: Tenant[], activeTenantId = ''): void {
    const normalized = (tenants || []).map((tenant) => ({
      ...tenant,
      _id: tenant._id || String((tenant as unknown as { id?: string }).id || ''),
    }));

    const nextActive = this.resolveActiveTenantId(normalized, activeTenantId);

    this.tenantsSubject.next(normalized);
    this.activeTenantIdSubject.next(nextActive);

    if (normalized.length) {
      localStorage.setItem(this.tenantsKey, JSON.stringify(normalized));
    } else {
      localStorage.removeItem(this.tenantsKey);
    }

    if (nextActive) {
      localStorage.setItem(this.activeTenantKey, nextActive);
    } else {
      localStorage.removeItem(this.activeTenantKey);
    }
  }

  isLoggedIn(): boolean {
    return Boolean(this.getToken());
  }

  private persistSession(token: string, user: BomoproUser, tenants: Tenant[], activeTenantId: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));

    this.userSubject.next(user);
    this.setTenantContext(tenants || [], activeTenantId || user.activeTenantId || '');
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const rawUser = localStorage.getItem(this.userKey);
    const rawTenants = localStorage.getItem(this.tenantsKey);
    const activeTenantId = localStorage.getItem(this.activeTenantKey) || '';

    if (!token || !rawUser) {
      return;
    }

    try {
      const user = JSON.parse(rawUser) as BomoproUser;
      const tenants = rawTenants ? (JSON.parse(rawTenants) as Tenant[]) : [];

      this.userSubject.next(user);
      this.setTenantContext(tenants, activeTenantId || user.activeTenantId || '');
    } catch {
      this.logout();
    }
  }

  private resolveActiveTenantId(tenants: Tenant[], candidate: string): string {
    if (!tenants.length) {
      return '';
    }

    if (candidate && tenants.some((tenant) => tenant._id === candidate)) {
      return candidate;
    }

    return tenants[0]._id;
  }
}
