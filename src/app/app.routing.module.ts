import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
 
const routes: Routes = [
  { path: '',         redirectTo:   '/synthesizer', pathMatch: 'full' },
  { path: 'analyser', loadChildren: './analyser/analyser.module#AnalyserModule' },
  { path: 'llk',      loadChildren: './llk/llk.module#LlkModule' }
];
 
@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}