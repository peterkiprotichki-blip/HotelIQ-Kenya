import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Property } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-property-view',
  templateUrl: './property-view.component.html',
  styleUrls: ['./property-view.component.scss'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-30px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class PropertyViewComponent implements OnInit {
  @Input() isOpen = false;
  @Input() property: Property | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Property>();

  typeOptions = ['apartment', 'commercial', 'plot', 'house', 'land'];
  statusOptions = ['active', 'inactive', 'maintenance'];

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {}

  getStatusColor(status?: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'maintenance':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'active':
        return 'fas fa-check-circle';
      case 'inactive':
        return 'fas fa-times-circle';
      case 'maintenance':
        return 'fas fa-tools';
      default:
        return 'fas fa-question-circle';
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onEdit(): void {
    if (this.property) {
      this.edit.emit(this.property);
    }
  }
}
