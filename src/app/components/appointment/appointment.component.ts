import { Component, OnInit, ViewChild } from '@angular/core';
import { AppointmentService } from 'src/app/services/appointment.service';
import { Appointment } from 'src/app/model/appointment';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'src/app/services/notification.service';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Paginator } from 'primeng/paginator';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css']
})
export class AppointmentComponent implements OnInit {
  appointments: Appointment[] = [];
  isLoading = true;
  appointmentError: string | null = null;
  searchTerm: string = '';
  filteredAppointments: Appointment[] = [];
  filteredAppointmentsLength: number = 0;
  showNoMatchingAppointmentsMessage = false; // Added this flag

  first = 0;
  rows = 3;
  totalRecords = 0;
  minRowsPerPage = 1;

  @ViewChild('paginator') paginator!: Paginator;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments() {
    this.authService.user$
      .pipe(
        switchMap((user) => {
          if (user) {
            const userUID = user.uid;
            return this.appointmentService.getAppointments(userUID);
          } else {
            return of([]);
          }
        })
      )
      .subscribe((appointments) => {
        this.appointments = appointments;
        this.filteredAppointments = [...appointments];
        this.filteredAppointmentsLength = appointments.length;

        this.filteredAppointments.sort((a, b) => {
          return a.selectedDate - b.selectedDate;
        });

        this.totalRecords = this.filteredAppointmentsLength;
        this.isLoading = false;

        this.rows = Math.max(this.minRowsPerPage, Math.min(3, this.filteredAppointmentsLength));
      });
  }

  filterAppointments() {
    if (!this.searchTerm) {
      this.filteredAppointments = [...this.appointments];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      this.filteredAppointments = this.appointments.filter((appointment) =>
        appointment.name.toLowerCase().includes(searchTermLower)
      );
    }

    this.filteredAppointmentsLength = this.filteredAppointments.length;
    this.totalRecords = this.filteredAppointmentsLength;
    this.rows = Math.min(3, this.filteredAppointmentsLength);
  }

  formatDateLabel(date: Date): string {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  }

  async cancelAppointment(appointment: Appointment): Promise<void> {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to cancel & delete this appointment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.appointmentError = null;
  
        const uid = await this.authService.getCurrentUserUID();
  
        if (uid) {
          const selectedDate = new Date(appointment.selectedDate);
          this.appointmentService.deleteAppointment(appointment.id).then(() => {
            this.notificationService.sendCancellationNotification(
              uid,
              appointment.name,
              appointment.email,
              selectedDate
            );
            const dateLabel = this.formatDateLabel(selectedDate);
            const message = `Your appointment on ${dateLabel} has been cancelled successfully.`;
  
            Swal.fire({
              title: 'Appointment Cancelled',
              text: message,
              icon: 'success',
            });
  
            const index = this.appointments.indexOf(appointment);
            if (index !== -1) {
              this.appointments.splice(index, 1);
            }
  
            this.isLoading = false;
          }).catch((error) => {
            this.appointmentError = error.message;
              Swal.fire({
              title: 'Error',
              text: this.appointmentError || 'An error occurred while cancelling the appointment.',
              icon: 'error',
            });
            this.isLoading = false;
          });
        } else {
          this.appointmentError = 'User is not authenticated.';
            Swal.fire({
            title: 'Error',
            text: this.appointmentError,
            icon: 'error',
          });
          this.isLoading = false;
        }
      }
    });
  }
  

  editAppointment(appointment: Appointment): void {
    this.router.navigate(['/edit-appointment', appointment.id]);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
  }
}
