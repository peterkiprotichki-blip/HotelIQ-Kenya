import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restriction
    }

    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // User doesn't have required role
    this.router.navigate(['/dashboard']);
    return false;
  }
}
