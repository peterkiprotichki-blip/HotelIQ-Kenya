import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PublicService, PublicProperty, PublicRoom } from '../../shared/services/public/public.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { NotificationService } from '../../shared/services/notification.service';
import { MapComponent } from '../../shared/components/map/map.component';
import { ChatbotWidgetComponent } from '../../shared/components/chatbot-widget/chatbot-widget.component';
import { AuthService } from '../../shared/services/auth/auth.service';

@Component({
  selector: 'app-public-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MapComponent, ChatbotWidgetComponent],
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
  userLat: number | null = null;
  userLng: number | null = null;

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
          const distA = this.getDistanceKm(this.userLat ?? a.latitude, this.userLng ?? a.longitude, a.latitude, a.longitude);
          const distB = this.getDistanceKm(this.userLat ?? b.latitude, this.userLng ?? b.longitude, b.latitude, b.longitude);
          return distA - distB;
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

  onLocationReady(coords: { lat: number; lng: number }): void {
    this.userLat = coords.lat;
    this.userLng = coords.lng;
    this.mapLatitude = coords.lat;
    this.mapLongitude = coords.lng;
    this.mapLabel = 'Your Location';
    this.loadNearbyEvents(coords.lat, coords.lng);
  }

  getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
          this.exploring = true;
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
          this.exploring = true;
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

  @HostListener('window:selectProperty', ['$event'])
  onSelectPropertyFromMap(event: any): void {
    const propId = event.detail;
    const prop = this.properties.find(p => p.id === propId || p._id === propId);
    if (prop) {
      this.selectProperty(prop);
      document.getElementById('lodges-section')?.scrollIntoView({ behavior: 'smooth' });
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

  expandedImage: string | null = null;

  private lodgeReviews: Record<string, Array<{ author: string; rating: number; text: string }>> = {
    'Mombasa Ocean Breeze Lodge': [
      { author: 'Jane M.', rating: 5, text: 'Beautiful beachfront lodge with stunning views. The staff were incredibly welcoming and the rooms spotless.' },
      { author: 'David K.', rating: 4, text: 'Great location right on Nyali Beach. Delicious seafood at the restaurant. Will definitely come back.' },
      { author: 'Sarah W.', rating: 5, text: 'Perfect family getaway. The Executive Suite with the jacuzzi was worth every shilling. Highly recommended!' },
      { author: 'Tom O.', rating: 4, text: 'Excellent value for a beachside lodge. Clean rooms, good food, and friendly service.' },
    ],
    'Eldoret Sirikwa Hotel': [
      { author: 'Peter C.', rating: 4, text: 'Classic Eldoret hotel with great character. Perfect base for exploring the Rift Valley.' },
      { author: 'Mercy A.', rating: 5, text: 'Outstanding hospitality! The staff went above and beyond. Great for business travelers.' },
      { author: 'James N.', rating: 4, text: 'Convenient location on Elgeyo Road. Comfortable rooms and good value for money.' },
    ],
    'The Boma Inn Eldoret': [
      { author: 'Lucy K.', rating: 5, text: 'Gorgeous hotel in Elgon View. The gardens are stunning and the rooms are luxurious.' },
      { author: 'Michael O.', rating: 4, text: 'Peaceful location with great views. The restaurant serves excellent local and international cuisine.' },
      { author: 'Ann W.', rating: 5, text: 'My favorite place to stay in Eldoret. The Deluxe rooms are spacious and beautifully decorated.' },
    ],
    'Eldoret Wagon Hotel': [
      { author: 'George M.', rating: 4, text: 'Affordable and comfortable. Great for short stays in Eldoret town center.' },
      { author: 'Faith N.', rating: 4, text: 'Clean rooms, friendly staff, and walking distance to Eldoret town. Good value.' },
      { author: 'Paul K.', rating: 3, text: 'Decent budget option. Basic but clean. Perfect for a quick overnight stay.' },
    ],
  };

  getLodgeImages(property: PublicProperty): string[] {
    const name = property.name;
    const hash = this.hashString(name);
    const ids = [hash % 1084, (hash * 7) % 1084, (hash * 13) % 1084, (hash * 17) % 1084];
    return ids.map(id => `https://picsum.photos/id/${id}/400/300`);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  getLodgeReviews(property: PublicProperty): Array<{ author: string; rating: number; text: string }> {
    return this.lodgeReviews[property.name] || [
      { author: 'Guest', rating: 4, text: 'Comfortable stay with friendly service.' },
    ];
  }

  getLodgeRating(property: PublicProperty): number {
    const reviews = this.getLodgeReviews(property);
    if (!reviews.length) return 4;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23e2e8f0"><rect width="400" height="300"/><text x="200" y="150" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="14">Image not available</text></svg>';
  }
}
