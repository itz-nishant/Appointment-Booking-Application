import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';
import { ProfileService } from 'src/app/services/profile.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AppointmentService } from 'src/app/services/appointment.service';
import { ImageCropperDialogComponent } from '../image-cropper-dialog/image-cropper-dialog.component';
import { ImageCropService } from 'src/app/services/imagecrop.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  name: string = '';
  email: string = '';
  newPassword: string = '';
  profilePictureUrl: string | any;
  selectedProfilePicture: File | null = null;
  uploadingProfilePicture: boolean = false;
  showPasswordChangeForm: boolean = false;
  loading: boolean = false;
  editingMode: boolean = false;
  backgroundColor: string = '';
  imageChangedEvent: any = '';
  croppedImage: any = '';

  @Output() profilePictureUpdated = new EventEmitter<string | null>();

  constructor(
    private afAuth: AngularFireAuth,
    private afStorage: AngularFireStorage,
    private authService: AuthService,
    private storageService: StorageService,
    private dialog: MatDialog,
    private profileService: ProfileService,
    private notificationService: NotificationService,
    private appointmentService: AppointmentService,
    private imageCropService: ImageCropService,
    private router: Router
  ) { 
    this.imageCropService.croppedImage$.subscribe((croppedImage) => {
      this.profilePictureUrl = croppedImage;
    });
  }

  ngOnInit() {
    this.afAuth.authState.subscribe(async (user: User | any) => {
      if (user) {
        this.user = user;
        this.email = user.email || '';

        const userData = await this.authService.getUserData(user.uid);
        if (userData) {
          this.name = userData || 'User';
        }

        this.authService.getUserBackgroundColor(user.uid).subscribe(bgColor => {
          this.backgroundColor = bgColor || getRandomColor();
        });

        const profilePicturePath = `profile-pictures/${user.uid}`;

        this.storageService.getDownloadURL(profilePicturePath).subscribe(url => {
          this.profilePictureUrl = url;
          this.profilePictureUpdated.emit(this.profilePictureUrl);
        });
      }
    });
  }

  onProfilePictureChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.isImageFile(file)) {
        this.imageChangedEvent = event;
        this.showImageCropper();
      } else {
        this.authService.showError('Please select a valid image file (jpg, jpeg, or png).');
      }
    }
  }

  showImageCropper(): void {
    if (this.imageChangedEvent) {
      console.log("Image data to be passed to the cropper dialog:", this.imageChangedEvent);
      const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
        width: '50%',
        data: {
          imageChangedEvent: this.imageChangedEvent,
        },
      });
  
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.croppedImage = result;
        }
      });
    }
  }
  

  isImageFile(file: File): boolean {
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const extension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }

  getInitialLetter(name: string): string {
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part[0]).join('');
    return initials.toUpperCase();
  }

  async updateProfile() {
    if (this.editingMode) {
      if (this.name.trim() === '') {
        this.authService.showError('Name cannot be empty.');
        return;
      }

      this.backgroundColor = getRandomColor();
      Swal.fire({
        title: 'Updating Profile',
        text: 'Please wait while we update your profile name...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await this.authService.updateUserProfile(this.name, this.backgroundColor);
        Swal.close();
        this.authService.showSuccess('Profile updated successfully');
        this.editingMode = false;
      } catch (error) {
        console.error('Error updating profile:', error);
        this.authService.showError('Failed to update profile. Please try again.');
      }
    } else {
      this.updateProfilePicture();
    }
  }

  async updateProfilePicture() {
    if (!this.croppedImage) {
      this.authService.showError("No changes were made to your profile picture.");
      return;
    }

    
    const newFileName = `${this.user?.uid}`;
    const path = `profile-pictures/${newFileName}`;
  
    Swal.fire({
      title: 'Updating Profile Picture',
      text: 'Please wait while we update your profile picture...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    const blob = this.dataURLtoBlob(this.croppedImage);
  
    try {
      const snapshot = await this.storageService.uploadFile(path, blob).snapshotChanges().toPromise();
      const url = await this.storageService.getDownloadURL(path).toPromise();
  
      this.profilePictureUrl = url;
      this.profileService.updateProfilePictureUrl(this.profilePictureUrl);
  
      Swal.close();
      this.authService.showSuccess('Profile picture updated successfully');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      this.authService.showError('Failed to update profile picture. Please try again.');
    } finally {
      this.uploadingProfilePicture = false;
      this.croppedImage = '';
    }
  }
  
  dataURLtoBlob(dataURL: string): any {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  showChangePasswordForm(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        console.log('Password changed successfully.');
      } else {
        console.log('Password change was unsuccessful.');
      }
    });
  }

  async deleteProfilePicture() {
    const result = await Swal.fire({
      title: 'Delete Profile Picture',
      text: 'Are you sure you want to delete your profile picture?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      focusConfirm: false,
    });

    if (result.isConfirmed) {
      try {
        const user = await this.afAuth.currentUser;
        if (!user) {
          console.error('User not authenticated.');
          return;
        }
        const profilePicturePath = `profile-pictures/${user.uid}`;

        await this.afStorage.ref(profilePicturePath).delete().toPromise();

        this.profilePictureUrl = null;

        this.profileService.updateProfilePictureUrl(null);

        Swal.fire({
          title: 'Profile Picture Deleted',
          text: 'Your profile picture has been deleted.',
          icon: 'success',
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Error deleting profile picture.',
          icon: 'error',
        });
      }
    }
  }

  async deleteAccount() {
    const result = await Swal.fire({
      title: 'Delete Account',
      text: 'Are you sure you want to permanently delete your account?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      focusConfirm: false,
    });

    if (result.isConfirmed) {
      try {
        if (!this.user) {
          console.error('User not authenticated.');
          this.authService.showError('User not authenticated.');
          return;
        }

        this.loading = true;

        await this.appointmentService.deleteAppointmentsByUserId(this.user.uid);
        await this.notificationService.deleteNotificationsByUserId(this.user.uid);

        // if (this.profilePictureUrl) {
        //   const profilePicturePath = `profile-pictures/${this.user.uid}`;
        //   await this.storageService.deleteFile(profilePicturePath).toPromise();
        // }

        await this.authService.deleteUser(this.user.uid);
        await this.user.delete();

        Swal.fire({
          title: 'Account Deleted',
          text: 'Your account has been deleted successfully.',
          icon: 'success',
        });

        this.router.navigate(['/login']);
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete account. Please try again.',
          icon: 'error',
        });
      } finally {
        this.loading = false;
      }
    }
  }
}

function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

