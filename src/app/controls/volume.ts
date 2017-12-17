import {MappingType} from '../core/value-mapping.service';

export class VolumeMeterSettings{
  id      : string                   = '';
  LEDNum  : [number, number, number] = [7,3,2]; //green yellow red
  range   : [number, number]         = [0, 1];
  reverse : boolean                  = false;
  vertical: boolean                  = false;
  channels: Array<number>            = [0, 0]; //stereo
  unit    : string                   = '';
  mapping : MappingType              = MappingType.Linear;
}