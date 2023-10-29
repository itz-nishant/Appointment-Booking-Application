import { Component, OnInit } from '@angular/core';
import { NotificationService } from 'src/app/services/notification.service';
import { Notification } from 'src/app/model/notification';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = true; 
  minLoaderDuration = 2000;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        const userUID = user.uid;
        this.isLoading = true; 
        this.loadNotifications(userUID);
      } else {
        this.isLoading = false; 
      }
    });
    this.notificationService.notifications$.subscribe((notifications) => {
      if (notifications.length > this.notifications.length) {
        this.playNotificationSound();
      }
      this.notifications = notifications;
      this.isLoading = false; 
    });
  }

  private loadNotifications(userUID: string): void {
    this.notificationService.getNotifications(userUID).subscribe((notifications) => {
      this.notifications = notifications;
      this.isLoading = false; 
    });
  }

  clearNotifications(): void {
    Swal.fire({
      title: 'Clear Notifications',
      text: 'Are you sure you want to clear notifications?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear them!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.user$.subscribe((user) => {
          if (user) {
            const userUID = user.uid;
            this.notificationService.clearNotifications(userUID);
            this.notifications = [];
  
            Swal.fire({
              title: 'Cleared Notifications',
              text: 'Notifications have been cleared.',
              icon: 'success',
            });
          }
        });
      }
    });
  }
  
  
  private playNotificationSound() {
    this.notificationService.playNotificationSound();
  }
}
