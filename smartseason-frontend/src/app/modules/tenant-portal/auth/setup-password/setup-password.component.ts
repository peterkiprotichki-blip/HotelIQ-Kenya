import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantPortalAuthService } from '../../shared/services/tenant-portal-auth.service';

@Component({
  selector: 'app-setup-password',
  templateUrl: './setup-password.component.html',
  styleUrls: ['./setup-password.component.scss'],
})
export class SetupPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  success = false;
  error = '';
  token = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: TenantPortalAuthService,
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', Validators.required],
      },
      { validators: this.passwordsMatch },
    );
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) this.error = 'Invalid or missing invite token.';
  }

  private passwordsMatch(group: FormGroup) {
    return group.get('password')?.value === group.get('confirm')?.value
      ? null
      : { mismatch: true };
  }

  submit() {
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.error = '';
    this.auth.setupPassword(this.token, this.form.value.password).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/tenant-portal/login']), 2500);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Setup failed. The link may be expired.';
        this.loading = false;
      },
    });
  }
}
