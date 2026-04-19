import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ReportsComponent } from './modules/reports/reports.component';
import { UsersListComponent } from './modules/users/users-list/users-list.component';
import { SettingsComponent } from './modules/settings/settings.component';
import { FieldsComponent } from './modules/fields/fields.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { RoleGuard } from './shared/guards/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'agent'] } },
      { path: 'fields', component: FieldsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'agent'] } },
      { path: 'reports', component: ReportsComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
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
