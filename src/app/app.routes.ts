import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./login').then((m) => m.Login)
	},
	{ path: '', pathMatch: 'full', redirectTo: 'calendar' },
	{
		path: 'calendar',
		loadComponent: () => import('./app').then((m) => m.App)
	}
];
