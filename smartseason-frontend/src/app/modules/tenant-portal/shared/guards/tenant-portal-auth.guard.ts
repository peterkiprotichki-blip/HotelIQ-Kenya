import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TenantPortalAuthService } from '../services/tenant-portal-auth.service';

@Injectable({ providedIn: 'root' })
export class TenantPortalAuthGuard implements CanActivate {
  constructor(private auth: TenantPortalAuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/tenant-portal/login']);
      return of(false);
    }
    // Verify with server — clears stale tokens automatically on 401
    return this.auth.verifyToken().pipe(
      map((profile) => {
        if (profile) return true;
        this.router.navigate(['/tenant-portal/login']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/tenant-portal/login']);
        return of(false);
      }),
    );
  }
}
