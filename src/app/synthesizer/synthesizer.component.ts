import { Component, Input, OnInit} from '@angular/core';
import { MappingType } from '../core/value-mapping.service';
import { SliderSettings } from '../controls/slider';
import { SuperService } from '../core/super.service';
import { KnobColors } from '../controls/knob';
import { KnobSettings }        from '../controls/knob';
import { ToneFreqService } from './keyboard/tone-freq.service';

@Component({
  // selector : 'synth-container',
  templateUrl : './synthesizer.component.html',
  styleUrls : ['./synthesizer.component.css']
})
export class SynthesizerComponent implements OnInit{
  oscs: Array<any>;
  adsrs: Array<any>;
  polyphony: KnobSettings;
  pan: KnobSettings;
  master: KnobSettings;
  lfos: Array<any>;
  filters: Array<any>;
  sequencers: Array<any>;
  filter: {
    input:SliderSettings;
  };
  sp: SuperService;
  ts: ToneFreqService;
  masterVolMeter: any;
  keyMode: any = {};

  constructor(sp: SuperService, ts: ToneFreqService){
    this.sp = sp;
    this.ts = ts;
  }
  ngOnInit(){
    this.adsrs = [
      {
        name: 'ADSR-M',
        display: true
      },
      {
        name: 'ADSR-1',
        display: false
      },
      {
        name: 'ADSR-2',
        display: false
      }
    ];
    this.lfos = [
      {
        name: 'LFO-1',
        display: false
      },{
        name: 'LFO-2',
        display: false
      },
    ];
    this.sequencers = [
      {
        name: 'SEQ-1',
        display: false
      },
      {
        name: 'SEQ-2',
        display: false
      }
    ];
    this.oscs = ['OSC1','OSC2','OSC3'];
    this.filters = ['Filter1', 'Filter2'];
    this.filter = {
      input:{
        id: 'filter-input-slider',
        size: 125,
        range: [0, 1],
        value: 1,
        unit: '',
        mapping: MappingType.Linear
      } as SliderSettings
    }
    this.sp.regFilterSerialRef(this.filter.input);
    this.polyphony = {
      id: 'master-polyphony',
      size: 40,
      range: [1, 10],
      value: 1,
      unit: '',
      step: 1,
      color: KnobColors.black,
      mapping: MappingType.Linear
    } as KnobSettings;
    this.pan = {
      id: 'master-pan',
      range: [-100, 100],
      size: 40,
      value: 0,
      color: KnobColors.red,
      unit: '%',
      mapping:  MappingType.Linear,
      mods: []
    } as KnobSettings;
    this.master = {
      id: 'master',
      range: [0, 1],
      size: 55,
      value: 1,
      color: KnobColors.blue,
      unit: '',
      mapping:  MappingType.Linear,
      mods: []
    } as KnobSettings;
    this.masterVolMeter = {
      id:'master-volume-meter',
      LEDNum: [7,3,2],
      range: [0, 1],
      reverse: false,
      vertical: true,
      channels: [0, 0],
      unit: '',
      mapping: MappingType.Linear
    };
    this.keyMode.modes = this.ts.getModes();
    this.keyMode.value = this.keyMode.modes[0].k;
    this.sp.regMasterVolMeter(this.masterVolMeter);
  }
  onFilterSerialSliderDrag(){
    this.sp.filterSerialChange();
  }
  modTabClick(mod){
    for(let i in this.adsrs){
      this.adsrs[i].display = false;
    }
    for(let i in this.lfos){
      this.lfos[i].display = false;
    }
    for(let i in this.sequencers){
      this.sequencers[i].display = false;
    }
    mod.display = true;
  }
  onPolyphonyChange(){
    this.sp.onPolyphonyChange(this.polyphony.value);
  }
  onPanDrag(){
    this.sp.onMasterPanDrag(this.pan.value/100);
  }
  onMasterDrag(){
    this.sp.onMasterDrag(this.master.value);
  }
  onCessationClick(){

  }
  onModeChange(e){
    this.ts.setMode(e.target.value);
  }
}