import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AfterViewInit } from '@angular/core';

import * as d3 from "d3"
import { SliderSettings } from './slider';
import { MappingType, ValueMappingService} from '../core/value-mapping.service'

@Component({
  selector : 'slider-container',
  templateUrl : './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements AfterViewInit {
  
  @Input()  settings : SliderSettings;
  @Output() onSliderDrag = new EventEmitter<number>();

  private sliderCtl;
  private slider;
  private accurateVal;
  private mouseY;
  private initOff;
  mapService;
  
  constructor(map: ValueMappingService) {
    this.mapService = map;
  }

  ngAfterViewInit(): void {
    if(!this.settings.id){
        throw "[Slider]: 'Slider ID' must be set by parent component!";
    }
    
    this.sliderCtl = d3.select('#'+ this.settings.id);
    this.slider = this.sliderCtl.select('.slider');
    this.slider.call(this.bindSlider());
    this.refSliderByVal();
  }
  protected bindSlider(){
    return  d3.drag()
      .on('start', () => {
        this.mouseY = d3.event.y;
        this.initOff = this.slider.attr('off');
      })
      .on('drag', () => {

        let lastVal = this.settings.value,
            dy      = d3.event.y - this.mouseY,
            rate    = 1,
            off     = Math.max(0, Math.min(80, (80-this.initOff) + dy * rate));

        this.setVal(off);
        this.refSliderByVal();
        if(this.settings.value != lastVal){
          this.onSliderDrag.emit();
        }
      })
  }
  protected refSliderByVal(){
    let off = this.getSliderOff(this.accurateVal ? this.accurateVal : this.settings.value);
    this.slider.attr('off', off)
               .attr('transform', 'translate(0 '+ (80 - off) +')');
  }

  protected setVal(off){
    let min = this.settings.range[0],
        max = this.settings.range[1],
        delta = this.mapService.map(1- off / 80, this.settings.mapping),
        val = min + (max - min) * delta;

    if(this.settings.step > 0){
      this.settings.value = Math.round(val / this.settings.step) * this.settings.step;
      this.accurateVal = +val.toFixed(3);
    }
    else{
      this.settings.value = +val.toFixed(3);
    }
  }

  protected getSliderOff(val){
    let min = this.settings.range[0],
        max = this.settings.range[1],
        c = (val - min) / (max - min);

    return this.mapService.unMap(c, this.settings.mapping) * 80;
  }
}