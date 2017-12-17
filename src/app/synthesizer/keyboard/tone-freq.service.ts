import { Injectable } from '@angular/core';

export enum Temperament{
  Twelvetone,
  Pythagorean
}

@Injectable()
export class ToneFreqService{
  private mode = Temperament.Twelvetone;
  private twelvetoneMap = {
    C : 261.6256,
    Db: 277.1826,
    D : 293.6648,
    Eb: 311.1270,
    E : 329.6276,
    F : 349.2282,
    Gb: 369.9944,
    G : 391.9954,
    Ab: 415.3047,
    A : 440,
    Bb: 466.1638,
    B : 493.8833
  };
  private pythagoreanMap = {
    C : 260.7407, //4
    Db: 278.4375, //5
    D : 293.3333, //2
    Eb: 313.2422, //7
    E : 330,      //2
    F : 347.6543, //5
    Gb: 371.25,   //4
    G : 391.1111, //3
    Ab: 417.6563, //6
    A : 440,      //1
    Bb: 463.5391, //6
    B : 495       //3
  };
  public getToneFreq(grp:number, tone:string){
    let freq = 440;
    switch(+this.mode){
      case Temperament.Twelvetone:
        freq = this.twelvetoneMap[tone];
      break;
      case Temperament.Pythagorean:
        freq = this.pythagoreanMap[tone];
      break;
    }
    return freq * Math.pow(2, grp-4);
  };
  public getModes(){
    return [
      {k: Temperament.Twelvetone, s: 'Twelvetone'},
      {k: Temperament.Pythagorean, s: 'Pythagorean'}
    ];
  }
  public getMode(){
    return this.mode;
  }
  public setMode(md){
    this.mode = md;
  }
}