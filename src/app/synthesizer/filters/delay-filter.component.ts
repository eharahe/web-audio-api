import { Component, Input, OnInit } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { MappingType } from '../../core/value-mapping.service';
import { KnobColors } from '../../controls/knob';

@Component({
  selector: 'delay-container',
  templateUrl: './delay-filter.component.html',
  styleUrls: ['./filter-panel.component.css']
})
export class DelayFilterComponent implements OnInit{

  @Input() name = 'Delay';
  settings;
  private sp = null;

  constructor(sp: SuperService){
    this.sp = sp;
  }
  ngOnInit():void{
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
      left: {
        id: this.name +'left',
        range: [0.001, 5.0],
        size: 40,
        value: 0.01,
        color: KnobColors.black,
        unit: 's',
        mapping:  MappingType.Linear
      },
      right: {
        id: this.name +'right',
        range: [0.001, 5.0],
        size: 40,
        value: 0.02,
        color: KnobColors.black,
        unit: 's',
        mapping:  MappingType.Linear
      }
    };
    this.sp.regDelayRef(this.settings);
  }
  onDrag(){
    this.sp.onDelayChange();
  }
}