import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service'; 

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading = true;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  resetPassword(): void {
    if (this.email) {
      this.isLoading = true;

      this.authService.resetPassword(this.email)
        .then(() => {
          this.authService.showSuccess('If registered, a password reset email has been sent. Check your inbox.');
        })
        .catch((error: any) => {
          console.error('Error sending password reset email:', error);
          this.authService.showError('Failed to send password reset email. Please try again.');
        })
        .finally(() => {
          this.isLoading = false;
        });
    } else {
      this.authService.showError('Please enter your email address.');
    }
  }
}
