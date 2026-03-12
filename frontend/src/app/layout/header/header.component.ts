import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  userName: string = 'User';
  userRole: string = 'user';

  private _router = inject(Router);
  private _platformId = inject(PLATFORM_ID);

  ngOnInit() {
    // 👈 Verificamos si estamos ejecutando el código en el navegador
    if (isPlatformBrowser(this._platformId)) {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        try {
          const user = JSON.parse(userDataStr);
          // Aseguramos que tome los datos, usando console.log si quieres debuggear
          this.userName = user.name || 'User';
          this.userRole = user.role || 'user';
        } catch (e) {
          console.error('Error al parsear user_data', e);
        }
      }
    }
  }

  logout() {
    if (isPlatformBrowser(this._platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
    }
    this._router.navigate(['/login']);
  }
}