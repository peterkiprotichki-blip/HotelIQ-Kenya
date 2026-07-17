import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { RoomsComponent } from './modules/rooms/rooms.component';
import { CalendarComponent } from './modules/calendar/calendar.component';
import { PricingAiComponent } from './modules/pricing-ai/pricing-ai.component';
import { EventsComponent } from './modules/events/events.component';
import { UsersListComponent } from './modules/users/users-list/users-list.component';
import { SettingsComponent } from './modules/settings/settings.component';
import { PublicBookingComponent } from './modules/public-booking/public-booking.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { RoleGuard } from './shared/guards/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'book', component: PublicBookingComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'agent'] } },
      { path: 'rooms', component: RoomsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'agent'] } },
      { path: 'calendar', component: CalendarComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'agent'] } },
      { path: 'pricing-ai', component: PricingAiComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'events', component: EventsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'agent'] } },
      { path: 'users', component: UsersListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'settings', component: SettingsComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
