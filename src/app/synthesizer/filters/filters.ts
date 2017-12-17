import { LP2FilterComponent } from './lp2-filter.component';
import { NoneFilterComponent } from './none-filter.component';
import { CompressorFilterComponent } from './compressor-filter.component';
import { WaveShaperFilterComponent } from './wave-shaper-filter.component';
import { MappingType } from '../../core/value-mapping.service';
import { KnobColors } from '../../controls/knob';

export enum FilterType{
  None,
  LP2,
  HP2,
  BP2,
  Compressor,
  WS
}

export interface FilterInterface {
  name: string;
  settings: any;
  logFilterChangeCb(cb: Function, parent: any):void
}

export function getFilterComponent(filterName:string, type:FilterType){
  switch(type){
    case FilterType.None:
      return NoneFilterComponent;
    case FilterType.LP2:
    case FilterType.HP2:
    case FilterType.BP2:
      return LP2FilterComponent;
    case FilterType.Compressor:
      return CompressorFilterComponent;
    case FilterType.WS:
      return WaveShaperFilterComponent;
  }
}

export function getFilterSettings(filterName:string, type:FilterType, settings?:any){
  switch(type){
    case FilterType.None:
      return null;
    case FilterType.LP2:
      return getFilterKnobs(
        filterName,
        settings && settings.freq || 20000,
        settings && settings.detune || 0,
        settings && settings.q || 1
      );
    case FilterType.HP2:
      return getFilterKnobs(
        filterName,
        settings && settings.freq || 0,
        settings && settings.detune || 0,
        settings && settings.q || 1
      );
    case FilterType.BP2:
      return getFilterKnobs(
        filterName,
        settings && settings.freq || 2000,
        settings && settings.detune || 0,
        settings && settings.q || 1
      );
    case FilterType.Compressor:
      return getCompKnobs(
        filterName,
        settings && settings.threshold || -24,
        settings && settings.knee || 30,
        settings && settings.attack || 0.003,
        settings && settings.release || 0.25,
        settings && settings.ratio || 12
      );
    case FilterType.WS:
      return {
        amount: {
          id: filterName +'-amount',
          range: [0, 1000],
          size: 40,
          value: settings && settings.amount || 0,
          color: KnobColors.black,
          unit: '',
          mapping: MappingType.Exp10,
          mods: []
        },
        curve: null
      }
  }
}

function getFilterKnobs(filterName, freq, detune, q){
  return {
    freq: {
      id: filterName +'-freq',
      range: [20, 20000],
      size: 60,
      value: freq,
      color: KnobColors.green,
      unit: 'hz',
      mapping: MappingType.Exp10,
      mods: []
    },
    detune: {
      id: filterName +'-detune',
      range: [-100, 100],
      size: 60,
      value: detune,
      unit: 'cent',
      color: KnobColors.purple,
      mapping: MappingType.Linear,
      mods: []
    },
    q: {
      id: filterName +'-q',
      range: [0.001, 100],
      size: 60,
      value: q,
      unit: '',
      color: KnobColors.blue,
      mapping: MappingType.Exp10,
      mods: []
    }
  }
}

function getCompKnobs(filterName, threshold, knee, attack, release, ratio){
  return {
    threshold: {
      id: filterName +'-threshold',
      range: [-100, 0],
      size: 40,
      value: threshold,
      color: KnobColors.blue,
      unit: 'db',
      mapping: MappingType.Linear,
      mods: []
    },
    knee: {
      id: filterName +'-knee',
      range: [0, 40],
      size: 40,
      value: knee,
      unit: '',
      color: KnobColors.blue,
      mapping: MappingType.Linear,
      mods: []
    },
    attack: {
      id: filterName +'-attack',
      range: [0.001, 1],
      size: 40,
      value: attack,
      unit: 's',
      color: KnobColors.purple,
      mapping: MappingType.Exp10,
      mods: []
    },
    release: {
      id: filterName +'-release',
      range: [0.001, 1],
      size: 40,
      value: release,
      unit: 's',
      color: KnobColors.purple,
      mapping: MappingType.Exp10,
      mods: []
    },
    ratio: {
      id: filterName +'-ratio',
      range: [1, 20],
      size: 40,
      value: ratio,
      unit: '',
      color: KnobColors.black,
      mapping: MappingType.Linear,
      mods: []
    }
  }
}