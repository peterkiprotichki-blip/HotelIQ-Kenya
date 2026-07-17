import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PublicService, PublicProperty, PublicRoom } from '../../shared/services/public/public.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { NotificationService } from '../../shared/services/notification.service';
import { MapComponent } from '../../shared/components/map/map.component';
import { AuthService } from '../../shared/services/auth/auth.service';

@Component({
  selector: 'app-public-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MapComponent],
  templateUrl: './public-booking.component.html',
})
export class PublicBookingComponent implements OnInit {
  properties: PublicProperty[] = [];
  rooms: PublicRoom[] = [];
  selectedProperty: PublicProperty | null = null;
  selectedRoom: PublicRoom | null = null;
  
  loadingProps = true;
  loadingRooms = false;
  bookingForm: FormGroup;
  bookingSuccess = false;
  bookingError = '';
  
  showPaymentModal = false;
  simulatingPayment = false;
  paymentSuccess = false;
  paymentPhone = '';
  
  mapLatitude = 0.5143; // Eldoret Default
  mapLongitude = 35.2698;
  mapLabel = 'Lodges Map';
  mapEvents: any[] = []; 

  // Auth fields
  authMode: 'signin' | 'signup' = 'signin';
  authEmail = '';
  authPassword = '';
  authName = '';
  authError = '';

  // Event Ticketing fields
  showTicketModal = false;
  selectedEventToBook: any = null;

  // Guest Dashboard fields
  myRoomBookings: any[] = [];
  myEventBookings: any[] = [];
  exploring = false;
  activeTab: 'lodges' | 'events' = 'lodges';

  constructor(
    private readonly publicService: PublicService,
    private readonly fb: FormBuilder,
    public readonly themeService: ThemeService,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    this.bookingForm = this.fb.group({
      guestName: ['', Validators.required],
      guestPhone: ['', [Validators.required, Validators.pattern(/^(?:\+254|0)[17]\d{8}$/)]],
      guestEmail: [''],
      checkIn: [today, Validators.required],
      checkOut: [tomorrowStr, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadProperties();
    if (this.isLoggedIn) {
      this.loadGuestDashboard();
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser(): any {
    return this.authService.getUser();
  }

  loadProperties(): void {
    this.loadingProps = true;
    this.publicService.getProperties().subscribe({
      next: (props) => {
        this.properties = props.sort((a, b) => {
          if (a.town === 'Eldoret' && b.town !== 'Eldoret') return -1;
          if (a.town !== 'Eldoret' && b.town === 'Eldoret') return 1;
          return 0;
        });
        this.loadingProps = false;
        if (this.properties.length > 0) {
          this.selectProperty(this.properties[0]);
        }
      },
      error: () => {
        this.loadingProps = false;
      }
    });
  }

  selectProperty(prop: PublicProperty): void {
    this.selectedProperty = prop;
    this.mapLatitude = prop.latitude;
    this.mapLongitude = prop.longitude;
    this.mapLabel = prop.name;
    this.selectedRoom = null;
    this.rooms = [];
    this.loadRooms(prop.id);
    this.loadNearbyEvents(prop.latitude, prop.longitude);
  }

  loadRooms(propertyId: string): void {
    this.loadingRooms = true;
    this.publicService.getRooms(propertyId).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.loadingRooms = false;
        if (rooms.length > 0) {
          this.selectedRoom = rooms[0];
        }
      },
      error: () => {
        this.loadingRooms = false;
      }
    });
  }

  loadNearbyEvents(lat: number, lng: number): void {
    const near = `${lat},${lng}`;
    this.publicService.getEvents(near, 100).subscribe({
      next: (events) => {
        this.mapEvents = events;
      },
      error: () => {
        this.mapEvents = [];
      }
    });
  }

  selectRoom(room: PublicRoom): void {
    this.selectedRoom = room;
  }

  get nightsCount(): number {
    const from = this.bookingForm.value.checkIn;
    const to = this.bookingForm.value.checkOut;
    if (!from || !to) return 0;
    const diff = new Date(to).getTime() - new Date(from).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  get totalCost(): number {
    if (!this.selectedRoom) return 0;
    return this.selectedRoom.basePrice * this.nightsCount;
  }

  triggerBookingFlow(): void {
    if (!this.isLoggedIn) {
      this.notificationService.error('Please sign in or sign up first.');
      return;
    }
    if (this.bookingForm.invalid || !this.selectedProperty || !this.selectedRoom) {
      this.notificationService.error('Please fill in guest details correctly');
      return;
    }
    
    this.paymentPhone = this.bookingForm.value.guestPhone;
    this.showPaymentModal = true;
    this.simulatingPayment = true;
    this.paymentSuccess = false;
    
    setTimeout(() => {
      this.simulatingPayment = false;
      this.paymentSuccess = true;
      
      this.completeBooking();
    }, 2500);
  }

  completeBooking(): void {
    const val = this.bookingForm.value;
    const payload = {
      propertyId: this.selectedProperty!.id,
      roomId: this.selectedRoom!._id,
      guestName: val.guestName,
      guestPhone: val.guestPhone,
      guestEmail: val.guestEmail || '',
      checkIn: new Date(val.checkIn).toISOString(),
      checkOut: new Date(val.checkOut).toISOString(),
      pricePerNight: this.selectedRoom!.basePrice,
      totalPrice: this.totalCost,
      source: 'direct',
    };

    this.publicService.createBooking(payload).subscribe({
      next: () => {
        this.notificationService.success('Booking confirmed! Welcome to Mombasa.');
        setTimeout(() => {
          this.showPaymentModal = false;
          this.bookingSuccess = true;
          this.loadGuestDashboard();
          this.bookingForm.reset({
            guestName: this.currentUser?.name || '',
            guestPhone: '',
            guestEmail: this.currentUser?.email || '',
            checkIn: new Date().toISOString().split('T')[0],
            checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0]
          });
        }, 1500);
      },
      error: (err) => {
        this.showPaymentModal = false;
        this.notificationService.error(err?.error?.message || 'Booking failed');
      }
    });
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  // Guest Auth methods
  submitAuth(forEvent = false): void {
    this.authError = '';
    if (this.authMode === 'signin') {
      if (!this.authEmail || !this.authPassword) {
        this.authError = 'Email and password are required';
        return;
      }
      this.authService.login(this.authEmail, this.authPassword).subscribe({
        next: (res) => {
          this.authError = '';
          this.authEmail = '';
          this.authPassword = '';
          this.notificationService.success('Logged in successfully!');
          // Populate name into guestName automatically
          this.bookingForm.patchValue({
            guestName: res.user.name,
            guestEmail: res.user.email
          });
          this.loadGuestDashboard();
        },
        error: (err) => {
          this.authError = err?.error?.message || 'Invalid credentials';
        }
      });
    } else {
      if (!this.authName || !this.authEmail || !this.authPassword) {
        this.authError = 'All fields are required';
        return;
      }
      this.authService.guestSignup(this.authName, this.authEmail, this.authPassword).subscribe({
        next: (res) => {
          this.authError = '';
          this.authEmail = '';
          this.authPassword = '';
          this.authName = '';
          this.notificationService.success('Account created and logged in!');
          this.bookingForm.patchValue({
            guestName: res.user.name,
            guestEmail: res.user.email
          });
          this.loadGuestDashboard();
        },
        error: (err) => {
          this.authError = err?.error?.message || 'Registration failed';
        }
      });
    }
  }

  logoutGuest(): void {
    this.authService.logout();
    this.myRoomBookings = [];
    this.myEventBookings = [];
    this.notificationService.success('Logged out successfully');
  }

  // Event Ticket Booking custom handlers
  @HostListener('window:bookTicket', ['$event'])
  onBookTicket(event: any): void {
    const eventId = event.detail;
    const evt = this.mapEvents.find(e => e.id === eventId || e._id === eventId);
    if (evt) {
      this.selectedEventToBook = evt;
      this.showTicketModal = true;
      this.authError = '';
    }
  }

  confirmEventTicket(): void {
    const eventId = this.selectedEventToBook.id || this.selectedEventToBook._id;
    const guestPhone = this.bookingForm.value.guestPhone || '';
    this.publicService.bookEventTicket(eventId, guestPhone).subscribe({
      next: () => {
        this.notificationService.success(`Ticket for ${this.selectedEventToBook.name} booked successfully! Enjoy your event.`);
        this.showTicketModal = false;
        this.selectedEventToBook = null;
        this.loadGuestDashboard();
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message || 'Failed to book ticket');
      }
    });
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
    this.selectedEventToBook = null;
  }

  loadGuestDashboard(): void {
    if (!this.isLoggedIn) return;

    // Load Room Bookings
    this.publicService.getMyBookings().subscribe({
      next: (bookings) => {
        this.myRoomBookings = bookings;
      },
      error: () => {
        this.myRoomBookings = [];
      }
    });

    // Load Event Bookings from backend
    this.publicService.getMyEventBookings().subscribe({
      next: (bookings) => {
        this.myEventBookings = bookings.map((b: any) => ({
          eventId: b.eventId,
          userEmail: b.guestEmail,
          eventName: b.event?.name || 'Local Event',
          eventCategory: b.event?.category || 'festival',
          eventDate: b.event?.startDate || b.bookedAt,
          eventLocation: b.event ? `${b.event.town}, ${b.event.county}` : 'Eldoret',
          bookedAt: b.bookedAt
        }));
      },
      error: () => {
        this.myEventBookings = [];
      }
    });
  }
}
