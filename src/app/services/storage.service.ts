import { Injectable } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(private storage: AngularFireStorage) {}

  uploadFile(filePath: string, file: File): AngularFireUploadTask {
    const storageRef = this.storage.ref(filePath);
    return storageRef.put(file);
  }

  getDownloadURL(filePath: string): Observable<string> {
    const storageRef = this.storage.ref(filePath);
    return storageRef.getDownloadURL();
  }

  deleteFile(filePath: string): Observable<void> {
    const storageRef = this.storage.ref(filePath);
    return storageRef.delete();
  }
}
