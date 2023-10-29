import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ImageCropService } from 'src/app/services/imagecrop.service';

@Component({
  selector: 'app-image-cropper-dialog',
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.css']
})
export class ImageCropperDialogComponent {
  imageChangedEvent: any;
  croppedImage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ImageCropperDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private imageCropService: ImageCropService
  ) {
    this.imageChangedEvent = data.imageChangedEvent;
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      this.blobToDataURL(event.blob).then(dataURL => {
        this.croppedImage = dataURL;
      });
    }
  }

  saveCroppedImage() {
    if (this.croppedImage) {
      this.imageCropService.setCroppedImage(this.croppedImage);
      this.dialogRef.close(this.croppedImage);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(blob);
    });
  }
}
