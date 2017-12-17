import { Injectable } from '@angular/core';

export enum MappingType {
  Linear,
  Exp,
  Exp10,
  LogE,
  Log10
}
export function mapVal (v: number, type: MappingType) : any {
  let rst = 0;
  switch(type){
    case MappingType.Linear:
         rst = v;
         break;
    case MappingType.Exp:
         rst = (Math.exp(v) - 1) / (Math.E - 1);
         break;
    case MappingType.Exp10:
         rst = (Math.pow(10, v) - 1) / 9;
         break;
    case MappingType.LogE:
         rst = Math.log(v*(Math.E-1) + 1);
         break;
    case MappingType.Log10:
         rst = Math.log10(v*9 + 1);
         break;
  }
  return rst;
}
export function unMap (v: number, type: MappingType) : any {
  let rst = 0;
  switch(type){
    case MappingType.Linear:
         rst = v;
         break;
    case MappingType.Exp:
         rst = Math.log(v*(Math.E-1) + 1);
         break;
    case MappingType.Exp10:
         rst = Math.log10(v*9 + 1);
         break;
    case MappingType.LogE:
         rst = (Math.exp(v) - 1) / (Math.E - 1);
         break;
    case MappingType.Log10:
         rst = (Math.pow(10, v) - 1) / 9;
         break;
  }
  return rst;
}
@Injectable()
export class ValueMappingService {
  map (v: number, type: MappingType) : any {
    return mapVal.apply(this, arguments);
  };

  unMap (v: number, type: MappingType) : any {
    return unMap.apply(this, arguments);
  }
}