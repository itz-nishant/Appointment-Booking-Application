import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private profilePictureUrlSubject = new BehaviorSubject<string | null>(null);
  profilePictureUrl$ = this.profilePictureUrlSubject.asObservable();

  updateProfilePictureUrl(url: string | null) {
    this.profilePictureUrlSubject.next(url);
  }
  
}
