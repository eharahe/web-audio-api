import { MappingType }         from '../../core/value-mapping.service';
import { KnobSettings }        from '../../controls/knob';
import { SliderSettings }      from '../../controls/slider';
import { VolumeMeterSettings } from '../../controls/volume';

export class Oscillator{
  on: boolean;
  customTypes: any;
  type: string;
  voicing: {
    num: KnobSettings;
    detune: KnobSettings;
    pan: KnobSettings;
    seed: KnobSettings;
  }
  tune: {
    coarse: KnobSettings;
    fine: KnobSettings;
  }
  pan: KnobSettings;
  vol: KnobSettings;
  mix: SliderSettings;
  volMeter: VolumeMeterSettings;
}