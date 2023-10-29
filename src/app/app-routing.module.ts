import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { NotificationListComponent } from './components/notification-list/notification-list.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { VerificationComponent } from './components/verification/verification.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from './guards/auth.guard'; 
// import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verification', component: VerificationComponent },
  // { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'home', component: AppointmentFormComponent, canActivate: [AuthGuard] },
  { path: 'appointment', component: AppointmentComponent, canActivate: [AuthGuard] },
  { path: 'edit-appointment/:id', component: AppointmentFormComponent, canActivate: [AuthGuard]},
  { path: 'notifications', component: NotificationListComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
