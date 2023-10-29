import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent implements OnInit {
  resendDisabled = false;
  timer: number = 10;
  timerInterval: any;

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    const uid = await this.authService.getCurrentUserUID();
    if (uid) {
      const isVerified = await this.authService.isEmailVerified(uid);
      if (isVerified) {
        this.resendDisabled = true;
      }
    } else {
      this.resendDisabled = true;
      this.startTimer();
    }
  }

  async resendVerificationEmail() {
    this.resendDisabled = true;

    try {
      await this.authService.sendVerificationEmail();
      this.authService.showSuccess('Verification email has already been sent.');
      this.startTimer();
    } catch (error) {
      this.resendDisabled = false;
      console.error('Error resending verification email:', error);
    }
  }

  startTimer() {
    this.timer = 10;
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(this.timerInterval); 
        this.resendDisabled = false; 
      }
    }, 1000);
  }
  
}
