import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  formData = {
    email: '',
    password: ''
  };
  isLoading = true;
  loginError: string | null = null; 
  showPassword = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  async login(loginForm: NgForm): Promise<void> {
    if (loginForm.valid) {
      this.isLoading = true;
      this.loginError = null;

      try {
        await this.authService.signIn(this.formData.email, this.formData.password);
        const currentUser = await this.afAuth.currentUser;

        if (currentUser) {
          if (currentUser.emailVerified) {
            const userName = await this.authService.getUserData(currentUser.uid);
        
            if (userName) {
              this.authService.showSuccess(`Welcome, ${userName}`);
              this.router.navigate(['/home']);
            } else {
              this.loginError = 'User data not found.';
              this.authService.showError(this.loginError);
            }
          } else {
            this.loginError = 'Email verification is required to login.';
            this.authService.showError(this.loginError);
            await this.authService.logout();
          }
        } else {
          this.loginError = 'User is not authenticated.';
          this.authService.showError(this.loginError);
        }
        
        if (this.loginError) {
          this.authService.showError(this.loginError);
        }
      } catch (error) {
        this.loginError = 'Login failed. Please check your credentials.';
        this.authService.showError(this.loginError);
        console.error('Login error:', error);
      } finally {
        setTimeout(() => {
          this.isLoading = false;
        }, 2000);
      }
    }
  }  

  async signInWithGoogle(): Promise<void>{
    this.isLoading = true;
    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/home']);
    } catch (error) {
      this.isLoading = false;
      console.error('Google login error:', error);
      this.authService.showError('Google login failed. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
