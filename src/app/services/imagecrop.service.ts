import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class ImageCropService {
  private croppedImageSource = new BehaviorSubject<string | null>(null);
  croppedImage$: Observable<string | null> = this.croppedImageSource.asObservable();

  setCroppedImage(croppedImage: string | null) {
    this.croppedImageSource.next(croppedImage);
  }
}
