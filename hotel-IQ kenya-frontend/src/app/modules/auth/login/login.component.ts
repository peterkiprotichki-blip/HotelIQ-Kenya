import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  showLoginPassword = false;
  loading = false;
  error = '';
  success = '';
  readonly signupDisabledMessage = 'To Sign up, Kindly contact admin for credentials. Happy to onboard you!';

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Handle Google OAuth callback
    this.route.queryParams.subscribe((params) => {
      if (params['token'] && params['user']) {
        try {
          const user = JSON.parse(params['user']);
          const tenants = params['tenants'] ? JSON.parse(params['tenants']) : [];
          const activeTenantId = params['activeTenantId'] || '';
          this.authService.handleGoogleCallback(params['token'], user, tenants, activeTenantId);
          this.router.navigate(['/dashboard']);
        } catch (e) {
          this.error = 'Failed to process login';
        }
      }
      if (params['error']) {
        this.error = params['message'] || 'Authentication failed';
      }
      if (params['verify']) {
        this.authService.verifyEmail(params['verify']).subscribe({
          next: (res) => { this.success = res.message; },
          error: (err) => { this.error = err.error?.message || 'Verification failed'; },
        });
      }
    });
  }

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid credentials';
      },
    });
  }

  googleLogin(): void {
    this.error = '';
    this.success = 'Google Sign-In is coming soon.';
  }

  showSignupDisabledNotice(): void {
    this.error = '';
    this.success = this.signupDisabledMessage;
  }
}
