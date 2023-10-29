import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import * as firebase from 'firebase/compat/app';
import { Observable, first, map } from 'rxjs';
import { AngularFireStorage, AngularFireStorageReference } from '@angular/fire/compat/storage';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$!: Observable<firebase.default.User | null>;
  backgroundColor!: string;

  constructor(
    public afAuth: AngularFireAuth,
    private router: Router,
    private snackBar: MatSnackBar,
    private db: AngularFireDatabase,
    private afStorage: AngularFireStorage
  ) {
    this.user$ = this.afAuth.authState;
    this.backgroundColor = this.getRandomColor(); 
  }


  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }


  async storeUserName(uid: string, name: string, backgroundColor: string) {
    try {
      const userRef = this.db.object(`users/${uid}`);
      await userRef.set({ name: name, backgroundColor: backgroundColor });
      console.log('User name and background color stored successfully.');
    } catch (error) {
      console.error('Error storing user name and background color:', error);
    }
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

  async signUp(email: string, password: string, name: string, backgroundColor: string) {
    try {
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
  
      const user = credential.user;
      if (user) {
        await user.updateProfile({
          displayName: name
        });
  
        await this.storeUserName(user.uid, name, backgroundColor);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  }
  

  signIn(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async logout(): Promise<void> {
    await this.afAuth.signOut();
    this.router.navigate(['/login']);
  }

  async getCurrentUserUID(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.afAuth.currentUser;

    if (!user) {
      this.showError('User not authenticated.');
      return;
    }

    const email = user.email;
    if (!email) {
      this.showError('User email not available.');
      return;
    }

    try {
      const credential = firebase.default.auth.EmailAuthProvider.credential(email, currentPassword);
      await user.reauthenticateWithCredential(credential);

      if (currentPassword === newPassword) {
        this.showError('New password must be different from the current password.');
        return;
      }

      try {
        await user.updatePassword(newPassword);
        this.showSuccess('Password changed successfully.');
      } catch (error: any) {
        this.showError('Failed to change password. Please try again.');
        console.error('Error updating password:', error);
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        this.showError('Current password is incorrect.');
      } else {
        this.showError('An error occurred while reauthenticating.');
        console.error('Reauthentication error:', error);
      }
    }
  }



  async getUserData(uid: string): Promise<string | null> {
    try {
      const snapshot = await this.db.object(`users/${uid}`).query.once('value');
      const userData = snapshot.val();

      if (userData && userData.name) {
        return userData.name;
      } else {
        console.error('User data or name not found.');
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  getUserDataa(uid: string): Observable<string | null> {
    return this.db.object(`users/${uid}`).valueChanges().pipe(
      map((userData: any) => {
        if (userData && userData.name) {
          return userData.name;
        } else {
          console.error('User data or name not found.');
          return null;
        }
      })
    );
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.db.object(`/users/${userId}`).remove();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      this.showSuccess('Password reset email sent. Please check your email inbox.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      this.showError('Failed to send password reset email. Please try again.');
    }
  }

  async sendVerificationEmail(): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      try {
        await user.sendEmailVerification();
        this.showSuccess('Verification email sent. Please check your email inbox.');
      } catch (error) {
        console.error('Error sending verification email:', error);
        this.showError('Failed to send verification email. Please try again.');
      }
    }
  }

  async isEmailVerified(uid: string): Promise<boolean> {
    try {
      const user = await this.afAuth.authState.pipe(first()).toPromise();
      return !!user && user.uid === uid && !!user.emailVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }
  
  

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new firebase.default.auth.GoogleAuthProvider();
      const credential = await this.afAuth.signInWithPopup(provider);
  
      if (credential.user) {
        const user = credential.user;
  
        const userSnapshot = await this.db.object(`users/${user.uid}`).valueChanges().pipe(first()).toPromise() as any;
  
        if (!userSnapshot || !userSnapshot.hasProfilePicture) {
          await this.storeUserDataInDatabase(user.uid, user.displayName, this.backgroundColor, user.photoURL);
  
          if (user.photoURL) {
            const existingProfilePicture = await this.afStorage.ref(`profile-pictures/${user.uid}`).getDownloadURL().toPromise().catch(() => null);
  
            if (!existingProfilePicture) {
              await this.storeProfilePicture(user.uid, user.photoURL);
            }
          }
        }
  
        this.showSuccess(`Welcome, ${user.displayName}`);
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      this.showError('Google Sign-In failed. Please try again.');
    }
  }
  
  async storeUserDataInDatabase(uid: string, displayName: string | null, backgroundColor: string, photoURL: string | null): Promise<void> {
    try {
      const userRef = this.db.object(`users/${uid}`);
      await userRef.set({
        name: displayName,
        backgroundColor,
        photoURL,
        hasProfilePicture: false,
      });
      console.log('User data, background color, and photo URL stored successfully.');
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }
  
  
  async storeProfilePicture(uid: string, photoURL: string): Promise<void> {
    try {
      const response = await fetch(photoURL);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
  
      reader.onload = async () => {
        const dataURL = reader.result as string;
  
        const storageRef: AngularFireStorageReference = this.afStorage.ref(`profile-pictures/${uid}`);
        
        await storageRef.putString(dataURL, 'data_url');
        
        console.log('Profile picture stored successfully.');
      };
  
      reader.onerror = (error) => {
        console.error('Error converting photoURL to data URL:', error);
      };
    } catch (error) {
      console.error('Error storing profile picture:', error);
    }
  }

  async updateUserProfile(name: string, backgroundColor: string) {
    try {
      const user = await this.afAuth.currentUser;
  
      if (user) {
        await user.updateProfile({
          displayName: name,
        });
        const uid = user.uid;
        await this.storeUserName(uid, name, backgroundColor);
  
        this.showSuccess('Profile updated successfully.');
      } else {
        this.showError('User not authenticated.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showError('Failed to update profile. Please try again.');
    }
  }

  getUserBackgroundColor(uid: string): Observable<string | null> {
    return this.db
      .object(`users/${uid}/backgroundColor`)
      .valueChanges()
      .pipe(
        map((color: string | any) => {
          return color || '';
        })
      );
  }
}