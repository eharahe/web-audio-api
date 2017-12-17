import { NgModule }            from '@angular/core';
import { RouterModule }        from '@angular/router';

import { SynthesizerComponent }    from './synthesizer.component';

@NgModule({
  imports: [RouterModule.forChild([
    { path: 'synthesizer', component: SynthesizerComponent }
  ])],
  exports: [RouterModule]
})
export class SynthesizerRoutingModule {}
