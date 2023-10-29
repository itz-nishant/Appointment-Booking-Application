import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ProfileService } from 'src/app/services/profile.service';
import { DarkModeService } from 'src/app/services/darkmode.service';

function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isAuthenticated: boolean = false;
  unreadNotificationCount: number = 0;
  userName: string = '';
  profilePictureUrl: string | null = null; 
  currentUserUID: string | null = null;
  backgroundColor: string = '';
  windowWidth: number = 0;
  
  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private profileService: ProfileService,
    private storage: AngularFireStorage,
    public darkModeService: DarkModeService,
    

  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      if (user) {
        this.currentUserUID = user.uid;
        this.authService.getUserDataa(user.uid).subscribe({
          next: userData => {
            this.userName = userData || user.displayName || '';
          },
          error: error => {
            console.error('Error getting user data:', error);
          }
        });

        this.loadProfilePicture(user.uid);
        this.loadBackgroundColor(user.uid);
      }
    });

    this.profileService.profilePictureUrl$.subscribe(url => {
      this.profilePictureUrl = url;
    });

    this.notificationService.unreadNotificationCount$.subscribe(count => {
      this.unreadNotificationCount = count;
    });
    this.windowWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth;
    });
    

  }

  isActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.windowWidth = window.innerWidth;
  }

  loadBackgroundColor(uid: string): void {
    if (this.currentUserUID === uid) {
      this.authService.getUserBackgroundColor(uid).subscribe(bgColor => {
        this.backgroundColor = bgColor || getRandomColor();
      });
    }
  }
  

  getInitialLetter(name: string): string {
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part[0]).join('');
    return initials.toUpperCase();
  }

  clearUnreadCount(): void {
    this.notificationService.clearUnreadCount();
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.authService.showError('Successfully Logged Out');
      this.router.navigate(['/login']);
      this.profilePictureUrl = null; 
    });
  }

  private loadProfilePicture(uid: string): void {
    const path = `profile-pictures/${uid}`;
    
    if (this.currentUserUID === uid) {
      this.storage.ref(path).getDownloadURL().subscribe(
        url => {
          this.profilePictureUrl = url;
        },
        error => {
          console.error('Error loading profile picture:', error);
        }
      );
    }
  }
  toggleDarkMode(): void {
    this.darkModeService.toggleDarkMode();
  }

  
}