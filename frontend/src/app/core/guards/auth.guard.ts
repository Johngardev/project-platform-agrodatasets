import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (token) {
    return true; // Déjalo pasar
  } else {
    router.navigate(['/login']); // Patada de vuelta al login
    return false;
  }
};