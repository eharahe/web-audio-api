import { NgModule }        from '@angular/core';
import { RouterModule }    from '@angular/router';

import { LlkComponent }    from './llk.component';

@NgModule({
  imports: [RouterModule.forChild([
    { path: '', component: LlkComponent }
  ])],
  exports: [RouterModule]
})
export class LlkRoutingModule {}
