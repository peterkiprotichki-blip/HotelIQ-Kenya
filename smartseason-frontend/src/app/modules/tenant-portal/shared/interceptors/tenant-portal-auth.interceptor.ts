import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TenantPortalAuthService } from '../services/tenant-portal-auth.service';

@Injectable()
export class TenantPortalAuthInterceptor implements HttpInterceptor {
  constructor(private portalAuth: TenantPortalAuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only attach portal token to tenant-portal API calls
    if (req.url.includes('/tenant-portal/')) {
      const token = this.portalAuth.getToken();
      if (token) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }
    }
    return next.handle(req).pipe(
      catchError((err) => {
        if (req.url.includes('/tenant-portal/') && err.status === 401) {
          this.portalAuth.logout();
          this.router.navigate(['/tenant-portal/login']);
        }
        return throwError(() => err);
      }),
    );
  }
}
