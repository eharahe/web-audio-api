import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { KnobSettings, KnobColors } from '../../controls/knob';
import { MappingType } from '../../core/value-mapping.service';

export class Adsr{
  attack: KnobSettings;
  attCurve: KnobSettings;
  hold: KnobSettings;
  decay: KnobSettings;
  decCurve : KnobSettings;
  sustain: KnobSettings;
  release: KnobSettings;
  relCurve: KnobSettings
}

// Quintic Bezier Curves
const curves = [
  function(x){
    let ts = x*x,
        tc = ts*x;
    return tc*ts + -5*ts*ts + 10*tc + -10*ts + 5*x;
  },
  function(x){
    let ts = x*x,
        tc = ts*x;
    return -1*ts*ts + 4*tc + -6*ts + 4*x;
  },
  function(x){
    let ts = x*x,
        tc = ts*x;
    return tc + -3*ts + 3*x;
  },
  function(x){
    return -1*x*x + 2*x;
  },
  function(x){
    return x;
  },
  function(x){
    return x*x;
  },
  function(x){
    return Math.pow(x, 3);
  },
  function(x){
    return Math.pow(x, 4);
  },
  function(x){
    return Math.pow(x, 5);
  },
]

@Component({
  selector : 'adsr-container',
  templateUrl : './adsr.component.html',
  styleUrls : ['./modulator.component.css']
})
export class ADSRComponent implements OnInit, AfterViewInit{

  @Input() name = 'adsr1';
  superService;
  param: Adsr;
  keyDownArr = [];
  keyUpArr = [];
  quantization = 12;
  canvasW = 304;
  canvasH = 104;
  canvasP = 2;

  constructor(ss:SuperService){
    this.superService = ss;
  }

  ngOnInit(){
    this.param = {
      attack:{
        id: this.name +'-attack',
        range: [0.001, 12],
        size: 40,
        value: 0.001,
        color: KnobColors.black,
        unit: 's',
        mapping: MappingType.Exp10
      },
      attCurve:{
        id: this.name +'-attcur',
        range: [-4, 4],
        size: 30,
        value: 0,
        color: KnobColors.purple,
        unit: '',
        step: 1,
        mapping: MappingType.Linear
      },
      hold:{
        id: this.name +'-hold',
        range: [0.001, 12],
        size: 40,
        value: 0.001,
        color: KnobColors.black,
        unit: 's',
        mapping: MappingType.Exp10
      },
      decay:{
        id: this.name +'-decay',
        range: [0.001, 12],
        size: 40,
        value: 0.37,
        color: KnobColors.black,
        unit: 's',
        mapping: MappingType.Exp10
      },
      decCurve:{
        id: this.name +'-deccur',
        range: [-4, 4],
        size: 30,
        value: 0,
        color: KnobColors.purple,
        unit: '',
        step: 1,
        mapping: MappingType.Linear
      },
      sustain:{
        id: this.name +'-sustain',
        range: [0, 1],
        size: 40,
        value: 1,
        color: KnobColors.black,
        unit: '',
        mapping: MappingType.Linear
      },
      release:{
        id: this.name +'-release',
        range: [0.001, 12],
        size: 40,
        value: 0.37,
        color: KnobColors.black,
        unit: 's',
        mapping: MappingType.Exp10
      },
      relCurve:{
        id: this.name +'-relcur',
        range: [-4, 4],
        size: 30,
        value: 0,
        color: KnobColors.purple,
        unit: '',
        step: 1,
        mapping: MappingType.Linear
      },
    } as Adsr;
  }
  ngAfterViewInit(){
    this.onDrag();
  }

  onDrag(){
    this.keyDownArr = this.getAttak().concat(this.getDecay());
    this.keyUpArr = this.getRelease();
    this.drawCurve();
    this.superService.regModRef(this.name, {type:'adsr', keydown: this.keyDownArr, keyup: this.keyUpArr});
  }
  private getAttak(){
    let att = this.param.attack.value,
        c = this.param.attCurve.value + 4,
        step = Math.max(0.001, att/this.quantization),
        t = 0,
        arr = [];

    while(t<att){
      arr.push({t:t, y:this.easing(t, 0, 1, 0, att, curves[c])});
      t += step;
    }
    arr.push({t:att, y:1});
    return arr;
  }
  private getDecay(){
    let att = this.param.attack.value,
        hold = this.param.hold.value,
        dec = this.param.decay.value,
        sus = this.param.sustain.value,
        c = this.param.decCurve.value + 4,
        step = Math.max(0.001, dec/this.quantization),
        t = att+hold,
        arr = [];

    while(t<att+hold+dec){
      arr.push({t:t, y:this.easing(t, 1, -1*(1-sus), att+hold, dec, curves[c])});
      t += step;
    }
    arr.push({t:att+hold+dec, y:sus});
    return arr;
  }
  private getRelease(){
    let sus = 1, //this.param.sustain.value,
        rel = this.param.release.value,
        c = this.param.relCurve.value + 4,
        step = Math.max(0.001, rel/this.quantization),
        t = 0,
        arr = [];

    while(t<rel){
      arr.push({t:t, y:this.easing(t, sus, -1*sus, 0, rel, curves[c])});
      t += step;
    }
    arr.push({t:rel, y:0});
    return arr;
  }
  private easing(t, offY, scaY, offT, scaT, c){
    return offY + scaY * c((t-offT) / scaT);
  }
  private drawCurve(){
    let canvas = document.getElementsByClassName(this.name+'-canvas')[0],
        ctx = canvas['getContext']('2d'),
        t1 = this.param.attack.value+
             this.param.hold.value+
             this.param.decay.value,
        t2 = t1 + this.param.release.value,
        getT = (t) => {
          return t * (this.canvasW-2*this.canvasP) + this.canvasP
        },
        getY = (y) => {
          return (1-y) * (this.canvasH-2*this.canvasP) + this.canvasP
        }

    ctx.clearRect(0,0,this.canvasW, this.canvasH);

    // draw attack
    ctx.beginPath();
    ctx.moveTo(getT(0), getY(0));
    for(let i=0; i<this.keyDownArr.length; i+=1){
      let pair = this.keyDownArr[i];
      ctx.lineTo(getT(pair.t/t2), getY(pair.y));
    }
    ctx.strokeStyle='lightblue';
    ctx.lineWidth=1;
    ctx.stroke();

    // draw release
    let sus = this.keyDownArr[this.keyDownArr.length-1].y
    ctx.beginPath();
    for(let i=0; i<this.keyUpArr.length; i+=1){
      let pair = this.keyUpArr[i];
      ctx.lineTo(getT((pair.t + t1)/t2), getY(pair.y * sus));
    }
    ctx.strokeStyle='orange';
    ctx.lineWidth=1;
    ctx.stroke();
  }
}