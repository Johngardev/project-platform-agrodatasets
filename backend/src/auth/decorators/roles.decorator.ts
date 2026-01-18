import { SetMetadata } from '@nestjs/common';

// Esta constante es la "llave" para leer los metadatos luego
export const ROLES_KEY = 'roles';

// Este es el decorador que usaremos en el controlador: @Roles('ADMIN', 'USER')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
