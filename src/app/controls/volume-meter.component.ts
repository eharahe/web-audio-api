import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AfterViewInit } from '@angular/core';

import { VolumeMeterSettings } from './volume';
import { MappingType, ValueMappingService} from '../core/value-mapping.service'

@Component({
  selector : 'volume-meter-container',
  templateUrl : './volume-meter.component.html',
  styleUrls: ['./volume-meter.component.css']
})
export class VolumeMeterComponent implements AfterViewInit {
  
  @Input() settings:VolumeMeterSettings;
 
  @Input() set channels(channels : Array<number>){
    this._channels = channels;
    let s = this.settings,
        gNum = s.LEDNum[0],
        yNum = s.LEDNum[1],
        rNum = s.LEDNum[2],
        N = gNum + yNum + rNum;

    if(!this.ledArr.length){
      this.doInit();
    }
    for(let i in channels){
      let threshold = Math.floor(N*channels[i]-1),
          leds = this.ledArr[i];

      for(let j in leds){
        if(+j <= threshold){
          leds[j].status = 'on';
        }
        else{
          leds[j].status = 'off';
        }
      } 
    }
  }
  get channels(): Array<number>{return this._channels}

  private _channels = [];
  ledArr = [];
  mapService;
  
  constructor(map: ValueMappingService) {
    this.mapService = map;
  }

  private doInit(): void{
    for(let i in this.settings.channels){
      let ch = [];
      this.ledArr[i]=[];
      for(let j=0; j<this.settings.LEDNum[0]; j++){
        ch.push({color:'green', status:'off'});
      }
      for(let j=0; j<this.settings.LEDNum[1]; j++){
        ch.push({color:'yellow', status:'off'});
      }
      for(let j=0; j<this.settings.LEDNum[2]; j++){
        ch.push({color:'red', status:'off'});
      }
      this.ledArr[i]=ch;
    }
  }
  ngAfterViewInit(): void {
    if(!this.settings.id){
        throw "[Meter]: 'Meter ID' must be set by parent component!";
    }
  }
}