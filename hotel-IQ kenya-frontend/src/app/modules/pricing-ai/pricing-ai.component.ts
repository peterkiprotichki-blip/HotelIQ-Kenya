import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PricingAiService, PricingSuggestion } from '../../shared/services/pricing-ai/pricing-ai.service';
import { RoomsService } from '../../shared/services/rooms/rooms.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

@Component({
  selector: 'app-pricing-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing-ai.component.html',
})
export class PricingAiComponent implements OnInit {
  suggestions: PricingSuggestion[] = [];
  roomTypes: string[] = ['Standard', 'Deluxe', 'Executive Suite'];
  selectedRoomType = 'Standard';
  loading = false;
  applyingId = '';
  error = '';

  constructor(
    private readonly pricingAiService: PricingAiService,
    private readonly roomsService: RoomsService,
    private readonly authService: AuthService,
    public readonly themeService: ThemeService,
    private readonly notificationService: NotificationService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.fetchSuggestions();
  }

  get propertyId(): string {
    return this.authService.getActiveTenantId();
  }

  fetchSuggestions(): void {
    if (!this.propertyId) {
      this.error = 'No active property found.';
      return;
    }

    this.loading = true;
    this.error = '';

    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 13); // Generate next 14 days
    const to = targetDate.toISOString().split('T')[0];

    this.pricingAiService.suggest(this.propertyId, this.selectedRoomType, from, to).subscribe({
      next: (res) => {
        this.suggestions = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to generate pricing suggestions';
        this.loading = false;
      },
    });
  }

  onRoomTypeChange(): void {
    this.fetchSuggestions();
  }

  applySuggestion(sug: PricingSuggestion): void {
    this.confirmationService.confirm({
      title: 'Apply Suggested Price',
      message: `Set the base price for all active ${sug.roomType} rooms to ${sug.suggestedPrice} KES?`,
      confirmText: 'Apply',
      cancelText: 'Cancel'
    }).then((confirmed) => {
      if (!confirmed) return;

      this.applyingId = sug.id;
      this.pricingAiService.apply(sug.id).subscribe({
        next: (res) => {
          this.applyingId = '';
          this.notificationService.success(res.message);
          this.fetchSuggestions(); // Reload to refresh base prices
        },
        error: (err) => {
          this.applyingId = '';
          this.notificationService.error(err?.error?.message || 'Failed to apply price');
        }
      });
    });
  }

  getPriceDiff(sug: PricingSuggestion): number {
    return sug.suggestedPrice - sug.basePrice;
  }

  getPriceDiffPercent(sug: PricingSuggestion): number {
    if (sug.basePrice === 0) return 0;
    return Math.round((this.getPriceDiff(sug) / sug.basePrice) * 100);
  }

  getScoreColor(score: number): string {
    if (score > 60) return '#ef4444'; // Red (High demand, raise price)
    if (score > 30) return '#f59e0b'; // Amber (Medium demand)
    return '#10b981'; // Green (Low demand, discount suggested)
  }
}
