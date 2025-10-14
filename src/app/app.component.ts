import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  standalone: true,
  imports: [CommonModule, RouterOutlet]
})
export class AppComponent {
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor(private theme: ThemeService) {
    this.theme.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOnline = true);
      window.addEventListener('offline', () => this.isOnline = false);
    }
  }

  retrySync() {
    // Placeholder: actual sync will be triggered by OutboxService when online
    if (!this.isOnline) return;
  }
}
