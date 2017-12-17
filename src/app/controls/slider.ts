import {MappingType} from '../core/value-mapping.service';

export class SliderSettings{
  id: string              = '';
  size: number            = 100;
  range: [number, number] = [0, 1];
  step: number            = 0;
  value: number           = 0;
  unit: string            = '';
  mapping: MappingType    = MappingType.Linear;
}