import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard], // Protege todas las rutas hijas
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [adminGuard], // Solo accesible para admins
        loadComponent: () =>
          import('./features/dashboard/pages/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'researchers',
        canActivate: [adminGuard], // Solo accesible para admins
        loadComponent: () =>
          import('./features/dashboard/pages/researchers/researchers.component').then(
            (m) => m.ResearchersComponent,
          ),
      },
      {
        path: 'pending-curation',
        canActivate: [adminGuard], // Solo accesible para admins
        loadComponent: () =>
          import('./features/dashboard/pages/pending-curation/pending-curation.component').then(
            (m) => m.PendingCurationComponent,
          ),
      },
      {
        path: 'dataset/:id',
        loadComponent: () =>
          import('./features/dashboard/pages/dataset-detail/dataset-detail.component').then(
            (m) => m.DatasetDetailComponent,
          ),
      },
      {
        path: 'dashboard',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./features/dashboard/pages/upload-page/upload-page.component').then(
        (m) => m.UploadPageComponent,
      ),
  },
  //LOGIN (Fuera del Layout Principal)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'auth',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // Manejo de error 404 (Siempre al final)
  {
    path: '**',
    redirectTo: '',
  },
];
