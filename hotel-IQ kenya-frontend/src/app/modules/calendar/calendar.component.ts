import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomsService, Room } from '../../shared/services/rooms/rooms.service';
import { BookingsService, Booking } from '../../shared/services/bookings/bookings.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './calendar.component.html',
  styles: [`
    .calendar-grid-container {
      display: grid;
      grid-template-columns: 150px repeat(14, minmax(80px, 1fr));
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .calendar-header-cell {
      padding: 10px;
      background-color: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
    }
    .dark .calendar-header-cell {
      background-color: #1e293b;
      border-bottom: 2px solid #334155;
      border-right: 1px solid #334155;
    }
    .calendar-room-cell {
      padding: 12px 10px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      border-right: 2px solid #e2e8f0;
      font-weight: bold;
      font-size: 13px;
      display: flex;
      align-items: center;
    }
    .dark .calendar-room-cell {
      background-color: #1e293b;
      border-bottom: 1px solid #334155;
      border-right: 2px solid #334155;
    }
    .calendar-day-cell {
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      position: relative;
      height: 60px;
      cursor: pointer;
    }
    .dark .calendar-day-cell {
      background-color: #0f172a;
      border-bottom: 1px solid #334155;
      border-right: 1px solid #334155;
    }
    .calendar-day-cell:hover {
      background-color: #f1f5f9;
    }
    .dark .calendar-day-cell:hover {
      background-color: #1e293b;
    }
    .booking-bar {
      position: absolute;
      left: 4px;
      right: 4px;
      top: 10px;
      bottom: 10px;
      border-radius: 6px;
      padding: 4px 6px;
      color: white;
      font-size: 10px;
      font-weight: bold;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
    }
  `]
})
export class CalendarComponent implements OnInit {
  rooms: Room[] = [];
  bookings: Booking[] = [];
  dates: Date[] = [];
  loading = true;
  error = '';

  showCreateModal = false;
  showDetailsModal = false;
  saving = false;
  bookingForm: FormGroup;
  selectedBooking: Booking | null = null;
  selectedRoomForCreate: Room | null = null;
  selectedDateForCreate: Date | null = null;

  sources = ['direct', 'walk-in', 'phone', 'referral'];

  // Booking list fields
  calendarActiveTab: 'calendar' | 'list' = 'calendar';
  allBookingsList: Booking[] = [];
  loadingBookingsList = false;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly bookingsService: BookingsService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    public readonly themeService: ThemeService,
    private readonly notificationService: NotificationService,
    private readonly confirmationService: ConfirmationService,
  ) {
    this.bookingForm = this.fb.group({
      guestName: ['', Validators.required],
      guestPhone: ['', [Validators.required, Validators.pattern(/^(?:\+254|0)[17]\d{8}$/)]],
      guestEmail: [''],
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
      source: ['direct', Validators.required],
    });
  }

  ngOnInit(): void {
    this.generateCalendarDays();
    this.loadData();
  }

  get propertyId(): string {
    return this.authService.getActiveTenantId();
  }

  generateCalendarDays(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.dates = [];
    for (let i = 0; i < 14; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      this.dates.push(nextDate);
    }
  }

  loadData(): void {
    if (!this.propertyId) {
      this.error = 'No active property found.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    const from = this.dates[0].toISOString();
    const to = this.dates[this.dates.length - 1].toISOString();

    this.roomsService.getAll(this.propertyId).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.bookingsService.getAll(this.propertyId, from, to).subscribe({
          next: (bookings) => {
            this.bookings = bookings;
            this.loading = false;
          },
          error: (err) => {
            this.error = err?.error?.message || 'Failed to load bookings';
            this.loading = false;
          },
        });
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load rooms';
        this.loading = false;
      },
    });
  }

  loadAllBookings(): void {
    if (!this.propertyId) return;
    this.loadingBookingsList = true;
    this.bookingsService.getAll(this.propertyId).subscribe({
      next: (res) => {
        this.allBookingsList = res.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
        this.loadingBookingsList = false;
      },
      error: (err) => {
        console.error('Failed to load bookings list', err);
        this.loadingBookingsList = false;
      }
    });
  }

  switchCalendarTab(tab: 'calendar' | 'list'): void {
    this.calendarActiveTab = tab;
    if (tab === 'list') {
      this.loadAllBookings();
    } else {
      this.loadData();
    }
  }

  refreshBookings(): void {
    this.loadData();
    if (this.calendarActiveTab === 'list') {
      this.loadAllBookings();
    }
  }

  getBookingForCell(roomId: string, date: Date): Booking | null {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const match = this.bookings.find((b) => {
      if (b.roomId !== roomId) return false;
      const start = new Date(b.checkIn);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.checkOut);
      end.setHours(0, 0, 0, 0);

      // Check if d falls in [start, end)
      return d >= start && d < end && b.status !== 'cancelled' && b.status !== 'no-show';
    });

    return match || null;
  }

  onCellClick(room: Room, date: Date, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('booking-bar') || target.closest('.booking-bar')) {
      return;
    }

    const booking = this.getBookingForCell(room._id || room.id, date);
    if (booking) {
      this.viewBookingDetails(booking);
    } else {
      this.openCreateBooking(room, date);
    }
  }

  viewBookingDetails(booking: Booking): void {
    this.selectedBooking = booking;
    this.showDetailsModal = true;
  }

  openCreateBooking(room: Room, date: Date): void {
    this.selectedRoomForCreate = room;
    this.selectedDateForCreate = date;

    const checkInStr = date.toISOString().split('T')[0];
    const checkOut = new Date(date);
    checkOut.setDate(checkOut.getDate() + 1);
    const checkOutStr = checkOut.toISOString().split('T')[0];

    this.bookingForm.patchValue({
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      source: 'direct',
    });

    this.showCreateModal = true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showDetailsModal = false;
    this.selectedBooking = null;
    this.selectedRoomForCreate = null;
    this.selectedDateForCreate = null;
  }

  createBooking(): void {
    if (this.bookingForm.invalid || !this.selectedRoomForCreate) {
      this.notificationService.error('Please fill in required fields correctly');
      return;
    }

    this.saving = true;
    const val = this.bookingForm.value;

    const payload = {
      propertyId: this.propertyId,
      roomId: this.selectedRoomForCreate._id || this.selectedRoomForCreate.id,
      guestName: val.guestName,
      guestPhone: val.guestPhone,
      guestEmail: val.guestEmail || '',
      checkIn: new Date(val.checkIn).toISOString(),
      checkOut: new Date(val.checkOut).toISOString(),
      pricePerNight: this.selectedRoomForCreate.basePrice,
      totalPrice: this.selectedRoomForCreate.basePrice, // default single night multiplier or dynamic calc
      source: val.source,
    };

    this.bookingsService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeModals();
        this.refreshBookings();
        this.notificationService.success('Booking created successfully');
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.error(err?.error?.message || 'Failed to create booking');
      },
    });
  }

  updateBookingStatus(status: 'checked-in' | 'checked-out' | 'cancelled' | 'no-show'): void {
    if (!this.selectedBooking) return;

    const actionText = status === 'cancelled' ? 'cancel' : status;
    this.confirmationService.confirm({
      title: 'Update Booking',
      message: `Are you sure you want to transition booking for ${this.selectedBooking.guestName} to ${actionText}?`,
      confirmText: 'Transition',
      cancelText: 'Cancel'
    }).then((confirmed) => {
      if (!confirmed) return;

      this.bookingsService.updateStatus(this.selectedBooking!._id || this.selectedBooking!.id, status).subscribe({
        next: () => {
          this.closeModals();
          this.refreshBookings();
          this.notificationService.success(`Booking status transitioned to ${status}`);
        },
        error: (err) => {
          this.notificationService.error(err?.error?.message || 'Status transition failed');
        }
      });
    });
  }

  getBookingBarColor(status: string): string {
    switch (status) {
      case 'confirmed': return '#0284c7'; // Cyan/Sky
      case 'checked-in': return '#10b981'; // Emerald
      case 'checked-out': return '#64748b'; // Slate
      case 'cancelled': return '#ef4444'; // Red
      case 'no-show': return '#f59e0b'; // Orange
      default: return '#6366f1';
    }
  }
}
