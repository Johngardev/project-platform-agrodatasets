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
	//LOGIN (Fuera del Layout Principal)
	{ 
		path: 'auth',
		redirectTo: '',
		pathMatch: 'full'
	},

  // Manejo de error 404 (Siempre al final)
  {
    path: '**',
    redirectTo: ''
  }
];
