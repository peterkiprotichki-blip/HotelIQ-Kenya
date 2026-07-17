import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  superAdminOnly?: boolean;
  roles?: string[]; // Specify which roles can see this item
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Input() mobileHidden = true;
  @Input() isMobile = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();

  allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fas fa-th-large', route: '/dashboard', roles: ['admin', 'agent'] },
    { label: 'Booking Calendar', icon: 'fas fa-calendar-alt', route: '/calendar', roles: ['admin', 'agent'] },
    { label: 'Rooms', icon: 'fas fa-door-open', route: '/rooms', roles: ['admin', 'agent'] },
    { label: 'Pricing AI', icon: 'fas fa-brain', route: '/pricing-ai', roles: ['admin'] },
    { label: 'Events Feed', icon: 'fas fa-map-marked-alt', route: '/events', roles: ['admin', 'agent'] },
    { label: 'Users', icon: 'fas fa-users-cog', route: '/users', roles: ['admin'] },
    { label: 'Settings', icon: 'fas fa-cog', route: '/settings', roles: ['admin'] },
  ];

  navItems: NavItem[] = [];
  private userSub?: Subscription;

  constructor(
    public router: Router,
    public themeService: ThemeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.user$.subscribe((user) => {
      const userRole = user?.role || '';
      this.navItems = this.allNavItems.filter((item) => {
        // If item has superAdminOnly flag, only show for super_admin
        if (item.superAdminOnly) {
          return userRole === 'super_admin';
        }
        // If item has roles array, check if user role is included
        if (item.roles) {
          return item.roles.includes(userRole);
        }
        // Default: show all items
        return true;
      });
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
