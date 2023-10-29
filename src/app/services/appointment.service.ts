import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { Appointment } from '../model/appointment';
import { User } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth
  ) {}

  getAppointments(userUID: string): Observable<Appointment[]> {
    return this.db.list<Appointment>(`appointments/${userUID}`).valueChanges();
  }

  getAppointmentById(userUID: string, appointmentId: string): Observable<Appointment | null> {
    return this.db.object<Appointment>(`appointments/${userUID}/${appointmentId}`).valueChanges();
  }

  async addAppointment(appointment: Appointment): Promise<void> {
    try {
      const user: User | any = await this.afAuth.currentUser;
      if (user) {
        const userUID = user.uid;
        const appointmentRef = this.db.list(`appointments/${userUID}`).push(appointment);
        const appointmentId = appointmentRef.key;
        if (appointmentId) {
          appointment.id = appointmentId;
          await appointmentRef.set(appointment);
        } else {
          throw new Error('Failed to generate appointment ID.');
        }
      } else {
        throw new Error('User not authenticated.');
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId: string, updatedAppointment: Appointment): Promise<void> {
    try {
      const user: User | any = await this.afAuth.currentUser;
      if (user) {
        const userUID = user.uid;
        const appointmentRef = this.db.object(`appointments/${userUID}/${appointmentId}`);
        if (appointmentRef) {
          await appointmentRef.update(updatedAppointment);
        } else {
          throw new Error('Appointment not found.');
        }
      } else {
        throw new Error('User not authenticated.');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const user: User | any = await this.afAuth.currentUser;
      if (user) {
        const userUID = user.uid;
        await this.db.object(`appointments/${userUID}/${appointmentId}`).remove();
      } else {
        throw new Error('User not authenticated.');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async deleteAppointmentsByUserId(userId: string): Promise<void> {
    try {
      await this.db.object(`/appointments/${userId}`).remove();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
