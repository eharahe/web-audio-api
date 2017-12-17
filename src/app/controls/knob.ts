import {MappingType} from '../core/value-mapping.service';

export const KnobColors = {
  blue: {
    stroke: '#6485b7',
    fill: '#3f5b82'
  },
  red: {
    stroke: '#d36867',
    fill: '#ab4948'
  },
  green: {
    stroke: '#709d6f',
    fill: '#408240'
  },
  black: {
    stroke: '#5b5b5b',
    fill: '#262626'
  },
  purple: {
    stroke: '#745c72',
    fill: '#473448'
  }
}

class KnobColor{
  stroke;
  fill;
}
class ModSettings{
  id: string;
  val: number
}
export class KnobSettings{
  id: string              = '';
  color: KnobColor        = KnobColors.blue;
  size: number            = 100;
  range: [number, number] = [0, 1];
  step: number            = 0;
  value: number           = 0;
  unit: string            = '';
  mapping: MappingType    = MappingType.Linear;
  mods: Array<ModSettings>;
}