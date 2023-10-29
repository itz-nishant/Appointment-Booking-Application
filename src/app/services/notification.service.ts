import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Notification } from '../model/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadNotificationCountSubject = new BehaviorSubject<number>(0);
  private notificationSound: HTMLAudioElement = new Audio("./../../../assets/notification-sound.mp3");

  unreadNotificationCount$ = this.unreadNotificationCountSubject.asObservable();
  notifications$ = this.notificationsSubject.asObservable();

  constructor(private db: AngularFireDatabase, private snackBar: MatSnackBar) { }

  playNotificationSound() {
    this.notificationSound.play();
  }


  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: 'success-notification'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: 'error-notification'
    });
  }

  getNotifications(uid: string): Observable<Notification[]> {
    return this.db
      .list<Notification>(`notifications/${uid}`)
      .valueChanges()
      .pipe(
        map((notifications) => {
          notifications.sort((a, b) => b.timestamp - a.timestamp);
          return notifications;
        })
      );
  }


  sendAppointmentNotification(
    uid: string,
    name: string,
    email: string,
    selectedDate: Date,
    isEdit: boolean = false
  ): void {
    const dateLabel = this.formatDateLabel(selectedDate);

    let message = '';

    if (isEdit) {
      message = `${name} (${email}) has updated an appointment for ${dateLabel}. Please review the appointment details.`;
    } else {
      message = `${name} (${email}) has successfully booked an appointment for ${dateLabel}. Please review the appointment details.`;
    }

    const notification: Notification = {
      sender: 'Appointment System',
      message: message,
      timestamp: new Date().getTime(),
      isRead: false
    };

    this.db.list<Notification>(`notifications/${uid}`)
      .push(notification)
      .then(() => {
        this.unreadNotificationCountSubject.next(this.unreadNotificationCountSubject.value + 1);
        this.playNotificationSound();
        console.log('Notification sent successfully.');
      })
      .catch((error) => {
        console.error('Error sending notification:', error);
      });
  }


  sendCancellationNotification(
    uid: string,
    name: string,
    email: string,
    canceledDate: Date
  ): void {
    const dateLabel = this.formatDateLabel(canceledDate);

    const message = `${name} (${email}) has cancelled the appointment scheduled for ${dateLabel}.`;

    const notification: Notification = {
      sender: 'Appointment System',
      message: message,
      timestamp: new Date().getTime(),
      isRead: false
    };

    this.db.list<Notification>(`notifications/${uid}`)
      .push(notification)
      .then(() => {
        this.unreadNotificationCountSubject.next(this.unreadNotificationCountSubject.value + 1);
        this.playNotificationSound();
        console.log('Cancellation notification sent successfully.');
      })
      .catch((error) => {
        console.error('Error sending cancellation notification:', error);
      });
  }

  private formatDateLabel(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  }

  clearUnreadCount(): void {
    this.unreadNotificationCountSubject.next(0);
  }

  clearNotifications(uid: string): void {
    this.db.list<Notification>(`notifications/${uid}`).remove().then(() => {
      this.notificationsSubject.next([]);
    });
  }

  async deleteNotificationsByUserId(userId: string): Promise<void> {
    try {
      await this.db.object(`/notifications/${userId}`).remove();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
