import { Component, OnInit, Input} from '@angular/core';

import { MappingType } from '../../core/value-mapping.service';
import { Oscillator } from './oscillator';
import { SuperService } from '../../core/super.service';
import { KnobColors } from '../../controls/knob';
import { PeriodicWaves } from './custom-periodic-wave';

@Component({
  selector : 'osc-container',
  templateUrl : './oscillator.component.html',
  styleUrls : ['./oscillator.component.css']
})
export class OscillatorComponent implements OnInit{

  @Input() name = 'OSC1';
  @Input() polyphony = 5;

  oscillator: Oscillator;
  private sp = null;

  constructor(sp: SuperService){
    this.sp = sp;
  }
  ngOnInit(){
    this.oscillator = {
      on : true,
      type: 'sine',
      customTypes: PeriodicWaves,
      voicing: {
        num: {
          id: this.name +'voice-num',
          range: [1, 12],
          size: 40,
          value: 1,
          color: KnobColors.black,
          unit: '',
          step: 1,
          mapping:  MappingType.Linear
        },
        detune: {
          id: this.name +'voice-detune',
          range: [0, 100],
          size: 40,
          value: 0,
          unit: 'cent',
          color: KnobColors.black,
          mapping:  MappingType.Linear
        },
        pan: {
          id: this.name +'voice-pan',
          range: [0, 100],
          size: 40,
          value: 0,
          unit: '%',
          color: KnobColors.black,
          mapping:  MappingType.Linear
        },
        seed: {
          id: this.name +'voice-seed',
          range: [0, 1],
          size: 40,
          value: 0,
          unit: '',
          color: KnobColors.black,
          mapping:  MappingType.Linear
        }
      },
      tune: {
        coarse: {
          id: this.name +'tune-coarse',
          range: [-48, 48],
          size: 70,
          value: 0,
          color: KnobColors.green,
          unit: 'semi',
          mapping:  MappingType.Linear,
          mods: []
        },      
        fine: {
          id: this.name +'tune-fine',
          range: [-100, 100],
          size: 70,
          value: 0,
          color: KnobColors.purple,
          unit: 'cent',
          mapping:  MappingType.Linear,
          mods: []
        },
      },
      pan: {
        id: this.name +'-pan',
        range: [-100, 100],
        size: 70,
        value: 0,
        color: KnobColors.red,
        unit: '%',
        mapping:  MappingType.Linear,
        mods: []
      },
      vol: {
        id: this.name +'-amp',
        range: [0, 1],
        size: 70,
        value: .5,
        color: KnobColors.blue,
        unit: '',
        mapping:  MappingType.Linear,
        mods: []
      },
      volMeter: {
        id: this.name +'-volume-meter',
        LEDNum: [7,3,2],
        range: [0, 1],
        reverse: false,
        vertical: false,
        channels: [0, 0],
        unit: '',
        mapping: MappingType.Linear
      },
      mix: {
        id: this.name +'-mix',
        size: 125,
        range: [0, 1],
        value: 1,
        unit: '',
        mapping: MappingType.Linear
      }
    } as Oscillator;
    this.sp.regOscRef(this.name, this.oscillator);
  }

  onTuneCoarseDrag(){
    this.sp.oscTuneChange(this.name);
  }
  onTuneFineDrag(){
    this.sp.oscFineChange(this.name);
  }
  onPanDrag(){
    this.sp.oscPanChange(this.name);
  }
  onAmpDrag(){
    this.sp.oscVolChange(this.name);
  }

  //voicing
  onVoiceNumDrag(){
    this.sp.oscVoicingChange(this.name);
  }
  onVoicePanDrag(){
    this.sp.oscVoicingChange(this.name);
  }
  onVoiceSeedDrag(){
    this.sp.oscVoicingChange(this.name);
  }
  onVoiceDetuneDrag(){
    this.sp.oscVoicingChange(this.name);
  }
  
  powerOnClick(){
    this.oscillator.on = !this.oscillator.on;
    this.sp.oscPowerChange(this.name);
  }

  onMixDrag(){
    this.sp.oscMixChange(this.name);
  }
}