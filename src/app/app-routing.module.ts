// import { NgModule } from "@angular/core";
// import { RouterModule, Routes } from "@angular/router";
// const routes: Routes = [
//   { path: '', redirectTo: 'builder', pathMatch: 'full' },
//   { path: 'builder', loadChildren: () => import('./builder/builder.module').then(m => m.BuilderModule) },
//   { path: 'forms/:id/run', loadChildren: () => import('./runtime/runtime.module').then(m => m.RuntimeModule) },
//   { path: 'forms/:id/submissions', loadChildren: () => import('./submissions/submissions.module').then(m => m.SubmissionsModule) },
//   { path: '**', redirectTo: 'builder' }
// ];


// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule],
// })
// export class AppRoutingModule { }

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'builder', pathMatch: 'full' },
  { path: 'builder', loadChildren: () => import('./builder/builder.module').then(m => m.BuilderModule) },
  { path: 'forms/:id/run', loadChildren: () => import('./runtime/runtime.module').then(m => m.RuntimeModule) },
  { path: 'forms/:id/submissions', loadChildren: () => import('./submissions/submissions.module').then(m => m.SubmissionsModule) },
  { path: '**', redirectTo: 'builder' }
];
