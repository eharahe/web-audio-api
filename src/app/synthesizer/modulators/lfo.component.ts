import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { KnobSettings, KnobColors } from '../../controls/knob';
import { MappingType } from '../../core/value-mapping.service';

enum LfoType{
  sine=1,
  tri=2,
  ramp=3
}

@Component({
  selector : 'lfo-container',
  templateUrl : './lfo.component.html',
  styleUrls : ['./modulator.component.css']
})
export class LFOComponent implements OnInit, AfterViewInit{

  @Input() name = 'lfo1';
  freqSetting: KnobSettings;
  delaySetting: KnobSettings;
  lfoTypes: Array<{k:LfoType;s:String}>;
  lfoArr = [];
  type:LfoType = LfoType.sine;
  superService;
  quantization = 16;
  maxLen = 8; //sec
  canvasW = 304;
  canvasH = 104;
  canvasP = 2;

  constructor(ss:SuperService){
    this.superService = ss;
  }

  ngOnInit(){
    this.freqSetting = {
      id: this.name + '-freq',
      color: KnobColors.black,
      size: 40,
      range: [0.2, 16],
      value: 2,
      unit: 'hz',
      mapping: MappingType.Exp10
    } as KnobSettings;
    this.delaySetting = {
      id: this.name + '-delay',
      color: KnobColors.black,
      size: 40,
      range: [0, 5],
      value: 0,
      unit: 's',
      mapping: MappingType.Exp10
    } as KnobSettings;
    this.lfoTypes = [
      {k:LfoType.sine, s:'sine'},
      {k:LfoType.tri, s:'tri'},
      {k:LfoType.ramp, s:'ramp'}
    ];
  }
  ngAfterViewInit(){
    this.onDrag();
  }

  onTypeChange(e){
    this.type = e.target.value;
    this.onDrag();
  }

  onDrag(){
    this.lfoArr = this.getCurve();
    this.drawCurve();
    this.superService.regModRef(this.name, {type:'lfo', arr:this.lfoArr});
  }

  getCurve(){
    let freq = +this.freqSetting.value,
        delay = +this.delaySetting.value,
        t = 1 / freq,
        step = t / this.quantization,
        arr = [];

    for(let i=0; i<=this.quantization; i++){
      let tOff = step*i,
          y = 0;

      switch(+this.type){
        case +LfoType.sine:
          y = Math.sin(Math.PI*2*i/this.quantization-Math.PI/2)*0.5+0.5;
          
          break;
        case +LfoType.tri:
          if(i<=this.quantization/2){
            y = 2*i/this.quantization;
          }
          else{
            y = 2-2*i/this.quantization;
          }
          break;
        case +LfoType.ramp:
          y = i/this.quantization;
          if(i==this.quantization-1){
            y = 1;
            tOff = t-0.001;
          }
          if(i==this.quantization){
            y = 0;
          }
          break;
        default:
          break;
      }
      arr.push({t:tOff+delay, y:y});
    }
    //repeat
    while(arr[arr.length-1].t < this.maxLen+delay){
      for(let i=0; i<this.quantization; i++){
        arr.push({t:arr[arr.length-this.quantization].t+t, y:arr[arr.length-this.quantization].y});
      }
    }
    return arr;
  }
  drawCurve(){
    let canvas = document.getElementsByClassName(this.name+'-canvas')[0],
        ctx = canvas['getContext']('2d'),
        t0 = 1/this.freqSetting.value,
        delay = this.delaySetting.value,
        getT = (t) => {
          return t * (this.canvasW-2*this.canvasP) + this.canvasP
        },
        getY = (y) => {
          return (1-y) * (this.canvasH-2*this.canvasP) + this.canvasP
        };

    ctx.clearRect(0,0,this.canvasW, this.canvasH);

    // draw axis
    ctx.beginPath();
    ctx.moveTo(getT(0), getY(0.5));
    ctx.lineTo(getT(1), getY(0.5));
    ctx.strokeStyle='lightblue';
    ctx.lineWidth=1;
    ctx.stroke();

    // drawperiod text
    ctx.font = "10px Calibri";
    ctx.fillStyle = "lightblue";
    ctx.fillText('T='+t0.toFixed(3)+"s", getT(0.85), getY(0.55));
    ctx.fillText('Delay='+delay.toFixed(3)+"s", getT(0.05), getY(0.55));

    // draw attack
    ctx.beginPath();
    ctx.moveTo(getT((this.lfoArr[0].t-delay)/t0), getY(this.lfoArr[0].y));
    for(let i=0; i<=this.quantization; i+=1){
      let pair = this.lfoArr[i];
      ctx.lineTo(getT((pair.t-delay)/t0), getY(pair.y));
    }
    ctx.strokeStyle='orange';
    ctx.lineWidth=1;
    ctx.stroke();
  }
}