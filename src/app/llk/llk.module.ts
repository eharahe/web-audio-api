import { NgModule }                from '@angular/core';
import { CommonModule }            from '@angular/common';
import { FormsModule }             from '@angular/forms';
import { LlkRoutingModule }        from './llk.routing.module';
import { LlkComponent}             from './llk.component';

@NgModule({
  imports:      [ CommonModule, FormsModule, LlkRoutingModule ],
  declarations: [ LlkComponent ],
  providers:    [  ]
})
export class LlkModule { }