import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Obtenemos los datos del usuario del localStorage
  const userDataString = localStorage.getItem('user_data');
  
  if (userDataString) {
    const user = JSON.parse(userDataString);
    
    // Verificamos si tiene el rol de administrador
    if (user.role === 'ADMIN') {
      return true; // Es admin, lo dejamos pasar
    } else {
      // Es un usuario normal, lo mandamos al dashboard regular
      router.navigate(['/']); 
      return false;
    }
  }

  // Si no está registrado, al login
  router.navigate(['/login']);
  return false;
};