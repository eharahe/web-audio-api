import { NgModule}              from '@angular/core';
import { CommonModule }         from '@angular/common';
import { FormsModule }          from '@angular/forms';

import { SimpleKnobComponent }  from './simple-knob.component';
import { ModableKnobComponent } from './modable-knob.component';
import { SliderComponent }      from './slider.component';
import { VolumeMeterComponent } from './volume-meter.component';

@NgModule({
  imports:      [ CommonModule ],
  declarations: [ SimpleKnobComponent, ModableKnobComponent, SliderComponent, VolumeMeterComponent ],
  exports:      [ SimpleKnobComponent, ModableKnobComponent, SliderComponent, VolumeMeterComponent ]
})
export class ControlsModule {}