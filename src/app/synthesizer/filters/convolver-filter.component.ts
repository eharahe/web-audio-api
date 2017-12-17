import { Component, Input, OnInit } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { MappingType } from '../../core/value-mapping.service';
import { ImpulseService } from './impulse.service';
import { KnobColors } from '../../controls/knob';

@Component({
  selector: 'convolver-container',
  templateUrl: './convolver-filter.component.html',
  styleUrls: ['./filter-panel.component.css']
})
export class ConvolverFilterComponent implements OnInit{

  @Input() name = 'Delay';
  settings;
  private sp = null;
  impulseTypes = [];
  private type;
  private is;

  constructor(sp: SuperService, is: ImpulseService){
    this.sp = sp;
    this.is = is;
  }
  ngOnInit():void{
    this.is.getImpulse(this.impulseTypes, this.sp.getAudioContext());
    this.settings = {
      mix: {
        id: this.name +'mix',
        range: [0, 1],
        size: 40,
        value: 0.2,
        color: KnobColors.black,
        unit: '',
        mapping:  MappingType.Linear
      },
      damp: {
        id: this.name +'damp',
        range: [200, 20000],
        size: 40,
        value: 6000,
        color: KnobColors.black,
        unit: 'hz',
        mapping:  MappingType.Linear
      },
      type: this.impulseTypes[0].k,
      buffer: null
    };
    this.sp.regConvolverRef(this.settings);
  }
  onDrag(){
    this.sp.onConvolverChange();
  }
  onTypeChange(e){
    this.settings.type = e.target.value;
    for(let i in this.impulseTypes){
      if(this.settings.type == this.impulseTypes[i].k){
        this.settings.buffer = this.impulseTypes[i].buffer || null;
      }
    }
    this.sp.onConvolverChange();
  }
}