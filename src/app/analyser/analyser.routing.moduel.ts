import { NgModule }        from '@angular/core';
import { RouterModule }    from '@angular/router';

import { AnalyserComponent }    from './analyser.component';

@NgModule({
  imports: [RouterModule.forChild([
    { path: '', component: AnalyserComponent }
  ])],
  exports: [RouterModule]
})
export class AnalyserRoutingModule {}
