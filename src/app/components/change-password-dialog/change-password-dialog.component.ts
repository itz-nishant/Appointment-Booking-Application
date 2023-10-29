import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.css']
})
export class ChangePasswordDialogComponent {
  changePasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
  
    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

  onCancelClick(): void {
    this.dialogRef.close(false);
  }

  onChangePasswordClick(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
  
      const currentPassword = this.changePasswordForm.value.currentPassword;
      const newPassword = this.changePasswordForm.value.newPassword;
  
      this.authService.changePassword(currentPassword, newPassword)
        .then(() => {
          this.isLoading = false; 
          this.dialogRef.close(true); 
          this.authService.showSuccess('Password changed successfully');
        })
        .catch((error: any) => {
          this.isLoading = false; 
          console.error('Password change error:', error);
          this.authService.showError('Failed to change password. Please try again.');
        });
    }
  }
}
