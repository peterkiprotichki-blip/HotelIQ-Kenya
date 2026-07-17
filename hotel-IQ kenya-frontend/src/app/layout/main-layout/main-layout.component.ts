import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  isMobile = false;
  mobileSidebarHidden = true;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 1024;
    if (this.isMobile) {
      this.mobileSidebarHidden = true;
    } else {
      this.mobileSidebarHidden = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileSidebarHidden = !this.mobileSidebarHidden;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileSidebar(): void {
    this.mobileSidebarHidden = true;
  }

  onNavigate(): void {
    if (this.isMobile) {
      this.mobileSidebarHidden = true;
    }
  }

  getMainContentClass(): string {
    if (this.isMobile) return 'ml-0';
    return this.sidebarCollapsed ? 'ml-16' : 'ml-64';
  }
}
