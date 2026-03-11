import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
		children: [
			{
				path: '',
				loadComponent: () => import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
			},
			{
				path: 'dataset/:id',
				loadComponent: () => import('./features/dashboard/pages/dataset-detail/dataset-detail.component').then(m => m.DatasetDetailComponent)
			},
			{
				path: 'dashboard',
				redirectTo: '',
				pathMatch: 'full'
			},
		]
	},
	{
		path: 'upload',
		loadComponent: () => import('./features/dashboard/pages/upload-page/upload-page.component').then(m => m.UploadPageComponent)
	},
	//LOGIN (Fuera del Layout Principal)
	{
		path: 'login',
		loadComponent: () => import('./features/login/login/login.component').then(m => m.LoginComponent)
	},
	{ 
		path: 'auth',
		redirectTo: 'login',
		pathMatch: 'full'
	},

  // Manejo de error 404 (Siempre al final)
  {
    path: '**',
    redirectTo: ''
  }
];
