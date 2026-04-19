import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Payment } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-payment-detail',
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss'],
})
export class PaymentDetailComponent implements OnInit {
  payment: Payment | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentsService: PaymentsService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.paymentsService.getById(id).subscribe({
      next: (p) => { this.payment = p; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  goBack(): void { this.router.navigate(['/payments']); }

  markCompleted(): void {
    if (!this.payment) return;
    this.paymentsService.markCompleted(this.payment._id).subscribe((p) => (this.payment = p));
  }

  deletePayment(): void {
    if (!this.payment || !confirm('Delete this payment?')) return;
    this.paymentsService.delete(this.payment._id).subscribe(() => this.goBack());
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return map[status] || '';
  }
}
