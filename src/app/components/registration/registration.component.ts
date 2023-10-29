import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  registrationError: string | null = null;
  isLoading: boolean = true;
  showPassword = false;
  backgroundColor!: string; 
  passwordStrength: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.backgroundColor = this.authService.getRandomColor(); 
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  checkPasswordStrength() {
    const password = this.password;
    const hasLetter = /[a-zA-Z]/.test(password); 
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(password); 
    const hasCapitalLetter = /[A-Z]/.test(password);
    const length = password.length;
  
    if (length < 6) {
      this.passwordStrength = 'Weak';
    } else if (length < 8  || !hasLetter || !hasNumber || !hasSymbol || !hasCapitalLetter) {
      this.passwordStrength = 'Moderate';
    } else {
      this.passwordStrength = 'Strong';
    }
  }
  
  async register(registrationForm: NgForm): Promise<void> {
    if (registrationForm.valid && !this.isLoading) {
      try {
        this.isLoading = true;
        const userName = this.name;
  
        await this.authService.signUp(this.email, this.password, this.name, this.backgroundColor);
        const uid = await this.authService.getCurrentUserUID();
  
        if (uid) {
          await this.authService.storeUserName(uid, userName, this.backgroundColor);
          await this.authService.sendVerificationEmail();
          await this.authService.showSuccess('Successfully User Registered. Please check your email for verification.');
          await this.authService.logout();
          this.router.navigate(['/verification']);
        } else {
          console.error('User UID is null.');
          this.registrationError = 'This email is already registered.';
          this.authService.showError(this.registrationError);
        }
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          this.registrationError = 'This email is already registered.';
          this.authService.showError(this.registrationError);
        } else {
          this.registrationError = 'Registration failed. Please try again later.';
          this.authService.showError(this.registrationError);
        }
      } finally {
        setTimeout(() => {
          this.isLoading = false;
        }, 2000);
      }
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}

