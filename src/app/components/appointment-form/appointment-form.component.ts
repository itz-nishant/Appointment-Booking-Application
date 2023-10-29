import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AppointmentService } from 'src/app/services/appointment.service';
import { Appointment } from 'src/app/model/appointment';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { User } from 'firebase/auth';

@Component({
  selector: 'app-appointment-form',
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnChanges {
  @Input() appointmentToEdit: Appointment | null = null;

  formData = {
    name: '',
    email: '',
    selectedDate: new Date()
  };  
  
  isLoading = false;
  formSubmitted = false;
  minDate: Date = new Date();
  appointmentError: string | null = null;
  isEditing = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private appointmentService: AppointmentService,
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    private router: Router

  ) {}

  ngOnInit() {
    this.route.params.subscribe(async (params) => {
      if (params['id']) {
        const appointmentId = params['id'];
        const user: User | any = await this.afAuth.currentUser;
        if (user) {
          const userUID = user.uid;
          this.appointmentService.getAppointmentById(userUID, appointmentId).subscribe((appointment) => {
            if (appointment) {
              this.appointmentToEdit = appointment;
              
              this.formData.name = appointment.name;
              this.formData.email = appointment.email;
              this.formData.selectedDate = new Date(appointment.selectedDate);
              
              this.isEditing = true;
            }
          });
        } else {
        }
      }
    });
  }
  
  
  ngOnChanges(changes: SimpleChanges): void {
    if ('appointmentToEdit' in changes && this.appointmentToEdit) {
      this.isEditing = true;
      this.formData.name = this.appointmentToEdit.name;
      this.formData.email = this.appointmentToEdit.email;
      this.formData.selectedDate = new Date(this.appointmentToEdit.selectedDate);
    } else {
      this.isEditing = false;
    }
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

  async bookAppointment(appointmentForm: NgForm): Promise<void> {
    if (appointmentForm.valid && this.formData.selectedDate !== null) {
      this.isLoading = true;
      this.appointmentError = null;

      const name = this.formData.name;
      const email = this.formData.email;
      const selectedDate = this.formData.selectedDate;

      const uid = await this.authService.getCurrentUserUID();

      if (uid) {
        if (this.isEditing && this.appointmentToEdit) {
          const updatedAppointment: Appointment = {
            ...this.appointmentToEdit,
            name,
            email,
            selectedDate: selectedDate.getTime()
          };
          this.appointmentService.updateAppointment(this.appointmentToEdit.id, updatedAppointment)
            .then(() => {
              this.notificationService.sendAppointmentNotification(uid, name, email, selectedDate, true);
              const dateLabel = this.formatDateLabel(selectedDate);
              const message = `Your appointment has been successfully updated for ${dateLabel === 'today' ? 'today' : dateLabel}`;
              this.notificationService.showSuccess(message);

              setTimeout(() => {
                this.isLoading = false;
              }, 1000);

              this.router.navigate(['/appointment']);
            })
            .catch((error) => {
              this.appointmentError = error.message;
              this.isLoading = false;
            });
        } else {
          const appointment: Appointment = {
            id: '',
            name,
            email,
            selectedDate: selectedDate.getTime()
          };
          this.appointmentService.addAppointment(appointment)
            .then(() => {
              this.notificationService.sendAppointmentNotification(uid, name, email, selectedDate);
              const dateLabel = this.formatDateLabel(selectedDate);
              const message = `Your appointment is successfully booked for ${dateLabel === 'today' ? 'today' : dateLabel}`;
              this.notificationService.showSuccess(message);
              this.formData.selectedDate = new Date();
              appointmentForm.resetForm({
                selectedDate: this.formData.selectedDate
              });
               setTimeout(() => {
                this.isLoading = false;
            }, 1000);
            })
            .catch((error) => {
              this.appointmentError = error.message;
              this.isLoading = false;
            });
        }
      } else {
        this.appointmentError = 'User is not authenticated.';
        this.notificationService.showError(this.appointmentError);
        this.isLoading = false;
      }
    } else {
      this.appointmentError = 'Validation failed: Please fill out all fields.';
      this.notificationService.showError(this.appointmentError);
      this.isLoading = false;
    }
  }
}
