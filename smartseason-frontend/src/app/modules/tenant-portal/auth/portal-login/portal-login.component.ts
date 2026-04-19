import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantPortalAuthService } from '../../shared/services/tenant-portal-auth.service';

@Component({
  selector: 'app-portal-login',
  templateUrl: './portal-login.component.html',
  styleUrls: ['./portal-login.component.scss'],
})
export class PortalLoginComponent implements OnInit {
  form: FormGroup;
  loading = false;
  checkingSession = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: TenantPortalAuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.checkingSession = true;
      this.auth.verifyToken().subscribe((profile) => {
        if (profile) {
          this.router.navigate(['/tenant-portal/dashboard']);
        } else {
          // Stale/invalid token was cleared — show login form
          this.checkingSession = false;
        }
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/tenant-portal/dashboard']),
      error: (err) => {
        this.error = err?.error?.message || 'Invalid email or password';
        this.loading = false;
      },
    });
  }
}
