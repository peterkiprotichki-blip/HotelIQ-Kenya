import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomsService, Room } from '../../shared/services/rooms/rooms.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './rooms.component.html',
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  loading = true;
  error = '';
  showCreateModal = false;
  saving = false;
  selectedRoom: Room | null = null;
  roomForm: FormGroup;

  roomTypes = ['Standard', 'Deluxe', 'Executive Suite', 'Family Suite', 'Presidential Suite'];

  constructor(
    private readonly roomsService: RoomsService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    public readonly themeService: ThemeService,
    private readonly notificationService: NotificationService,
    private readonly confirmationService: ConfirmationService,
  ) {
    this.roomForm = this.fb.group({
      roomNumber: ['', Validators.required],
      roomType: ['Standard', Validators.required],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      capacity: [1, [Validators.required, Validators.min(1)]],
      amenitiesStr: [''],
    });
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  get propertyId(): string {
    return this.authService.getActiveTenantId();
  }

  loadRooms(): void {
    if (!this.propertyId) {
      this.error = 'No active property selected. Please setup property first.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = '';
    this.roomsService.getAll(this.propertyId).subscribe({
      next: (res) => {
        this.rooms = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load rooms';
        this.loading = false;
      },
    });
  }

  openCreateModal(room?: Room): void {
    this.selectedRoom = room || null;
    this.showCreateModal = true;

    if (room) {
      this.roomForm.patchValue({
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        basePrice: room.basePrice,
        capacity: room.capacity,
        amenitiesStr: room.amenities.join(', '),
      });
    } else {
      this.roomForm.reset({
        roomNumber: '',
        roomType: 'Standard',
        basePrice: 5000,
        capacity: 2,
        amenitiesStr: 'WiFi, TV, AC',
      });
    }
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.selectedRoom = null;
    this.roomForm.reset();
  }

  saveRoom(): void {
    if (this.roomForm.invalid) return;

    this.saving = true;
    const val = this.roomForm.value;
    const amenities = val.amenitiesStr
      ? val.amenitiesStr.split(',').map((a: string) => a.trim()).filter(Boolean)
      : [];

    const payload = {
      propertyId: this.propertyId,
      roomNumber: val.roomNumber,
      roomType: val.roomType,
      basePrice: Number(val.basePrice),
      capacity: Number(val.capacity),
      amenities,
    };

    const request$ = this.selectedRoom
      ? this.roomsService.update(this.selectedRoom._id, payload)
      : this.roomsService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadRooms();
        this.notificationService.success(
          this.selectedRoom ? 'Room updated successfully' : 'Room created successfully'
        );
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.error(err?.error?.message || 'Failed to save room');
      },
    });
  }

  deleteRoom(room: Room): void {
    this.confirmationService.confirm({
      title: 'Delete Room',
      message: `Are you sure you want to delete Room ${room.roomNumber}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }).then((confirmed) => {
      if (!confirmed) return;

      this.roomsService.delete(room._id).subscribe({
        next: () => {
          this.loadRooms();
          this.notificationService.success('Room deleted successfully');
        },
        error: (err) => {
          this.notificationService.error(err?.error?.message || 'Failed to delete room');
        }
      });
    });
  }
}
