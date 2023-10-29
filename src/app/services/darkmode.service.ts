import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  private isDarkMode = false;

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.updateBodyClass();
  }

  getIsDarkMode(): boolean {
    return this.isDarkMode;
  }

  private updateBodyClass() {
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }
}
