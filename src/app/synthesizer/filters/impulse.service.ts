import { Injectable } from '@angular/core';
const IR = [
  {k:'bypass', s:'Bypass', f:''},
  {k:'room1', s:'Room-1.27s', f:'home_bedroom1_1.wav'},
  // {k:'room2', s:'Room-1.43s', f:'home_bedroom2_1.wav'},
  {k:'room3', s:'Room-1.78s', f:'home_livingroom_1.wav'},
  {k:'hall1', s:'Hall-2.42s', f:'hall2.wav'},
  {k:'hall2', s:'Hall-2.74s', f:'hall4.wav'}
];
@Injectable()
export class ImpulseService {
  getImpulse (types, ctx) : void {
    types.push(IR[0]);
    for(let i=1; i<IR.length; i++){
      this.getFile(IR[i].f, ctx, (b)=>{
        types.push({
          k: IR[i].k,
          s: IR[i].s,
          buffer: b
        })
      });
    }
  };
  private getFile(fn, ctx, cb){
    let rq = new XMLHttpRequest();
    rq.open('GET', 'assets/impulse/'+fn, true);
    rq.responseType = 'arraybuffer';
    rq.onload = function() {
      var audioData = rq.response;

      ctx.decodeAudioData(
        audioData, 
        (buffer)=>{cb(buffer);},
        (e)=>{ console.log("Error with decoding audio data" + e.err);}
       );
    };
    rq.send();
  }
}