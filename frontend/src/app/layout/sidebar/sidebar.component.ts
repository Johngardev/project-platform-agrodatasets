import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  userRole: string = 'user';

  private _platformId = inject(PLATFORM_ID);

  ngOnInit() {
    // 👈 Protegemos el acceso al localStorage
    if (isPlatformBrowser(this._platformId)) {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        try {
          const user = JSON.parse(userDataStr);
          this.userRole = user.role || 'user';
        } catch (e) {
          console.error('Error al parsear user_data', e);
        }
      }
    }
  }
}
