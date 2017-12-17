import { NgModule }                from '@angular/core';
import { CommonModule }            from '@angular/common';
import { FormsModule }             from '@angular/forms';
import { AnalyserRoutingModule }   from './analyser.routing.moduel';
import { AnalyserComponent }       from './analyser.component';
import { ControlsModule }          from '../controls/controls.module';

@NgModule({
  imports:      [ 
    CommonModule,
    FormsModule,
    AnalyserRoutingModule,
    ControlsModule
  ],
  declarations: [ AnalyserComponent ],
  providers:    [  ]
})
export class AnalyserModule { }