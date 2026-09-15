import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const token = localStorage.getItem('auth_token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Roles permitidos para esta ruta (definidos en app.routes.ts con "data: { roles: [...] }")
  const rolesPermitidos: string[] = route.data['roles'];
  const rolUsuario = localStorage.getItem('user_role');

  if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario ?? '')) {
    // El usuario está autenticado pero no tiene el rol necesario
    router.navigate(['/dashboard']); // lo mandamos a una página segura, no al login
    return false;
  }

  return true;
};