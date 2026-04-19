import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { PropertyTenant } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-add-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" *ngIf="isOpen">
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 w-full max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
        <!-- Header -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Add Tenant</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new tenant record in the system</p>
        </div>

        <!-- Form -->
        <form [formGroup]="tenantForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Full Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g., John Kariuki"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
              [style.--tw-ring-color]="themeService.accent"
              [class.border-red-500]="isFieldInvalid('name')"
            />
            <p *ngIf="isFieldInvalid('name')" class="text-sm text-red-500 mt-1">Full name is required</p>
          </div>

          <!-- Email and Phone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="john@example.com"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('email')"
              />
              <p *ngIf="isFieldInvalid('email')" class="text-sm text-red-500 mt-1">Please enter a valid email address</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="0712345678"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('phone')"
              />
              <p *ngIf="isFieldInvalid('phone')" class="text-sm text-red-500 mt-1">{{ getPhoneError() }}</p>
            </div>
          </div>

          <!-- ID Number and KRA PIN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID Number <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="idNumber"
                placeholder="12345678"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('idNumber')"
              />
              <p *ngIf="isFieldInvalid('idNumber')" class="text-sm text-red-500 mt-1">ID number is required</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                KRA PIN <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="kraPin"
                placeholder="A001234567U"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
              />
            </div>
          </div>

          <!-- Occupation and Employer -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Occupation <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="occupation"
                placeholder="e.g., Software Engineer"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employer <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="employer"
                placeholder="e.g., Tech Company Ltd"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
              />
            </div>
          </div>

          <!-- Address -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="address"
              placeholder="123 Main Street, Nairobi"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
              [style.--tw-ring-color]="themeService.accent"
              [class.border-red-500]="isFieldInvalid('address')"
            />
            <p *ngIf="isFieldInvalid('address')" class="text-sm text-red-500 mt-1">Address is required</p>
          </div>

          <!-- Emergency Contact Name and Phone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="emergencyContactName"
                placeholder="Jane Kariuki"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('emergencyContactName')"
              />
              <p *ngIf="isFieldInvalid('emergencyContactName')" class="text-sm text-red-500 mt-1">Emergency contact name is required</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact Phone <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                formControlName="emergencyContactPhone"
                placeholder="0712345678"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('emergencyContactPhone')"
              />
              <p *ngIf="isFieldInvalid('emergencyContactPhone')" class="text-sm text-red-500 mt-1">{{ getEmergencyPhoneError() }}</p>
            </div>
          </div>

          <!-- Emergency Contact Relationship -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relationship <span class="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              formControlName="emergencyContactRelationship"
              placeholder="e.g., Sister, Brother, Spouse"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
              [style.--tw-ring-color]="themeService.accent"
            />
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              formControlName="notes"
              placeholder="Add any additional notes about the tenant..."
              rows="3"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition resize-none"
              [style.--tw-ring-color]="themeService.accent"
            ></textarea>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              (click)="onCancel()"
              [disabled]="loading"
              class="px-6 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="!tenantForm.valid || loading"
              [style.background-color]="(tenantForm.valid && !loading) ? themeService.accent : '#ccc'"
              class="px-6 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i *ngIf="loading" class="fas fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Creating...' : 'Create Tenant' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep {
        input:focus,
        textarea:focus {
          @apply ring-2 ring-offset-0;
        }
      }
    `,
  ],
})
export class AddTenantFormComponent implements OnInit {
  @Output() tenantCreated = new EventEmitter<PropertyTenant>();
  @Output() closed = new EventEmitter<void>();

  isOpen = false;
  tenantForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private tenantService: PropertyTenantsService,
    public themeService: ThemeService,
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {}

  private initializeForm(): void {
    this.tenantForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: ['', [Validators.required, this.kenyaPhoneValidator]],
      idNumber: ['', Validators.required],
      kraPin: [''],
      occupation: [''],
      employer: [''],
      address: ['', Validators.required],
      emergencyContactName: ['', Validators.required],
      emergencyContactPhone: ['', [Validators.required, this.kenyaPhoneValidator]],
      emergencyContactRelationship: [''],
      notes: [''],
    });
  }

  /**
   * Phone number validator for Kenyan numbers
   * Accepts formats: 0712345678, +254712345678, 254712345678
   */
  private kenyaPhoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const value = control.value.toString().trim();
    const kenyaPhoneRegex = /^(?:254|\+254|0)(?:7|1)[0-9]{8}$/;

    if (!kenyaPhoneRegex.test(value)) {
      return { invalidPhone: true };
    }
    return null;
  }

  open(): void {
    this.isOpen = true;
    this.initializeForm();
    this.errorMessage = '';
    this.successMessage = '';
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onCancel(): void {
    this.close();
  }

  onSubmit(): void {
    if (!this.tenantForm.valid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.tenantForm.value;

    this.tenantService.create(formData).subscribe({
      next: (tenant) => {
        this.loading = false;
        this.successMessage = `Tenant "${tenant.name}" created successfully!`;
        this.tenantCreated.emit(tenant);
        setTimeout(() => {
          this.close();
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create tenant. Please try again.';
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tenantForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getPhoneError(): string {
    const phone = this.tenantForm.get('phone');
    if (phone?.hasError('required')) return 'Phone number is required';
    if (phone?.hasError('invalidPhone')) return 'Please enter a valid Kenyan phone number (0712345678)';
    return '';
  }

  getEmergencyPhoneError(): string {
    const phone = this.tenantForm.get('emergencyContactPhone');
    if (phone?.hasError('required')) return 'Emergency contact phone is required';
    if (phone?.hasError('invalidPhone')) return 'Please enter a valid Kenyan phone number (0712345678)';
    return '';
  }
}
