import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AfterViewInit } from '@angular/core';

import * as d3 from "d3"
import { KnobSettings } from './knob';
import { MappingType, ValueMappingService} from '../core/value-mapping.service'

@Component({
  selector : 'knob-container',
  templateUrl : './simple-knob.component.html',
  styleUrls: ['./modable-knob.component.css']
})
export class SimpleKnobComponent implements AfterViewInit {
  
  @Input()  settings : KnobSettings;
  @Output() onKnobDrag = new EventEmitter<number>();

  knobCtl;
  knobBtn;
  mapService;
  center = 38;
  accurateVal = null;
  
  constructor(map: ValueMappingService) {
    this.mapService = map;
  }

  ngAfterViewInit(): void {
    if(!this.settings.id){
        throw "[Modable Knob]: 'knob ID' must be set by parent component!";
    }
    
    this.knobCtl = d3.select('#'+ this.settings.id);
    this.knobBtn = this.knobCtl.select('.knob-btn');
    this.knobBtn.call(this.bindKnob());
    this.refKnobByVal();
  }
  protected bindKnob(){
    return  d3.drag()
      .on('drag', () => {
        let lastVal = this.settings.value,
            dy   = d3.event.dy,
            rate = 0.5 + 0.1* Math.min(dy * dy, 2),
            r    = Math.max(0, Math.min(300, + this.knobBtn.attr('rot') + dy * rate));

        this.setVal(r);
        this.refKnobByVal();
        if(this.settings.value != lastVal){
          this.onKnobDrag.emit();
        }
      })
  }
  protected refKnobByVal(){
    let deg = this.getKnobDeg(this.accurateVal ? this.accurateVal : this.settings.value);
    this.knobBtn.attr('rot', deg)
                 .attr('transform', 'rotate('+ deg +','+this.center+' '+this.center+')');
  }

  protected setVal(deg){
    let min = this.settings.range[0],
        max = this.settings.range[1],
        delta = this.mapService.map(deg / 300, this.settings.mapping),
        val = min + (max - min) * delta;

    if(this.settings.step > 0){
      this.settings.value = Math.round(val / this.settings.step) * this.settings.step;
      this.accurateVal = +val.toFixed(3);
    }
    else{
      this.settings.value = +val.toFixed(3);
    }
  }

  protected getKnobDeg(val){
    let min = this.settings.range[0],
        max = this.settings.range[1],
        c = (val - min) / (max - min);

    return this.mapService.unMap(c, this.settings.mapping) * 300;
  }
}