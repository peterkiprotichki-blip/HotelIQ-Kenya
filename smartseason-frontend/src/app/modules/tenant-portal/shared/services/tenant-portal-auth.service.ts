import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PortalProfile } from '../interfaces/portal.interfaces';

const TOKEN_KEY = 'portal_token';
const PROFILE_KEY = 'portal_profile';

@Injectable({ providedIn: 'root' })
export class TenantPortalAuthService {
  private readonly apiUrl = environment.apiUrl;

  private profileSubject = new BehaviorSubject<PortalProfile | null>(this.storedProfile());
  profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient) {}

  setupPassword(token: string, password: string) {
    return this.http.post(`${this.apiUrl}/tenant-portal/auth/setup-password`, { token, password });
  }

  login(email: string, password: string) {
    return this.http
      .post<{ token: string; profile: PortalProfile }>(`${this.apiUrl}/tenant-portal/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(res.profile));
          this.profileSubject.next(res.profile);
        }),
      );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    this.profileSubject.next(null);
  }

  /** Calls GET /tenant-portal/profile to validate the stored token.
   *  Returns the profile on success, or null (after clearing the session) on 401/error. */
  verifyToken(): Observable<PortalProfile | null> {
    return this.http.get<PortalProfile>(`${this.apiUrl}/tenant-portal/profile`).pipe(
      tap((profile) => {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        this.profileSubject.next(profile);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getProfile(): PortalProfile | null {
    return this.profileSubject.value;
  }

  private storedProfile(): PortalProfile | null {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
