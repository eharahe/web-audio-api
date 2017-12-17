import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { KnobSettings, KnobColors } from '../../controls/knob';
import { MappingType } from '../../core/value-mapping.service';
import * as d3 from "d3"

@Component({
  selector : 'sqc-container',
  templateUrl : './sequencer.component.html',
  styleUrls : ['./modulator.component.css']
})
export class SequencerComponent implements OnInit, AfterViewInit{

  @Input() name = 'sqc1';
  freqSetting: KnobSettings;
  attackSetting: KnobSettings;
  sustainSetting: KnobSettings;
  releaseSetting: KnobSettings;
  sqcBarUrl: 'background: url(assets/img/sqc.png)';
  sqcArr = [];
  sqcCurveArr = [];
  superService;
  seqNum = 8;
  maxSeqNum = 32;
  maxLen = 16; //sec
  canvasW = 0;
  canvasH = 24;
  canvasP = 2;
  pointsPerBar = 4;

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
    this.sustainSetting = {
      id: this.name + '-sus',
      color: KnobColors.black,
      size: 40,
      range: [0, 100],
      value: 50,
      unit: '%',
      step: 1,
      mapping: MappingType.Linear
    } as KnobSettings;
    this.attackSetting = {
      id: this.name + '-att',
      color: KnobColors.black,
      size: 40,
      range: [0, 100],
      value: 0,
      unit: '%',
      step: 1,
      mapping: MappingType.Linear
    } as KnobSettings;
    this.releaseSetting = {
      id: this.name + '-rel',
      color: KnobColors.black,
      size: 40,
      range: [0, 100],
      value: 0,
      unit: '%',
      step: 1,
      mapping: MappingType.Linear
    } as KnobSettings;
    for(let i=0; i<this.maxSeqNum; i++){
      this.sqcArr.push({val:100, link:false});
    }
    this.canvasW = this.seqNum * 352/16;
  }
  ngAfterViewInit(){
    this.onDrag();
    let bars = d3.selectAll('.'+this.name+'-blk');
    bars.call(this.bindBar());
  }
  onLinkFlip(i){
    this.sqcArr[i].link = !this.sqcArr[i].link;
    this.onDrag();
  }
  onDrag(){
    this.sqcCurveArr = this.getCurve();
    this.drawCurve();
    this.superService.regModRef(this.name, {type:'sqc', arr:this.sqcCurveArr});
  }
  private refSeqArr(i, e){
    var off = e.offsetY-1,
        total = d3.select('.'+this.name+'-blk').property('clientHeight')-2,
        step = 100/24,
        acc = 100 * (total - off) / total,
        val = Math.round(acc/step)*step;

    this.sqcArr[i].val = val;
  }
  private bindBar(){
    return  d3.drag()
      .on('start', () => {       
        this.doBarDrag(d3.event.sourceEvent);
      })
      .on('drag', () => {
        this.doBarDrag(d3.event.sourceEvent);
      })
  }
  private doBarDrag(e){
    let ind = null;

    if(e.currentTarget && e.currentTarget.getAttribute){ //IE Edge
      ind = e.currentTarget.getAttribute('index');
    }
    else if(e.path){ //Webkit
      ind = this.findBarInd(e.path, 'sqc-blk-btn');
    }
    if(ind){
      this.refSeqArr(ind, e);
      this.onDrag();
    }
  }
  private findBarInd(arr, cls){
    for(let i in arr){
      let lst = arr[i].classList;
      for(let j in lst){
        if(lst[j] == cls){
          return arr[i].getAttribute('index');
        }
      }
    }
    return null;
  }
  seqNumChange(type){
    if(type=="more"){
      this.seqNum = Math.min(this.maxSeqNum, this.seqNum+1);
    }
    else{
      this.seqNum = Math.max(1, this.seqNum-1);
    }
    this.canvasW = this.seqNum * 352/16;
    setTimeout(()=>{
       this.onDrag();
    },0)
  }

  getCurve(){
    let freq = +this.freqSetting.value,
        t0 = 1 / freq,
        attLen = Math.max(0.001, t0 * +this.attackSetting.value/100),
        susLen = Math.max(0.001, t0 * +this.sustainSetting.value/100),
        relLen = Math.max(0.001, t0 * +this.releaseSetting.value/100),
        attOff = attLen,
        susOff = Math.min(t0, attLen+susLen),
        relOff = Math.min(t0, attLen+susLen+relLen),
        relBase = 0,
        arr = [];

    if(susOff == t0){
      this.pointsPerBar = 2;
    }
    else if(relOff == t0){
      this.pointsPerBar = 3,
      relBase = (attLen+susLen+relLen - t0) / relLen;
    }
    else{
      this.pointsPerBar = 4;
    }
    arr.push({t:0, y:0})
    for(let i=0; i<this.seqNum; i++){
      let ts = t0*i;
      arr.push({t:ts+attOff, y:this.sqcArr[i].val/100});
      if(this.sqcArr[i].link){
        for(let j=0; j<this.pointsPerBar-1; j++){
          arr.push({t:ts+t0, y:this.sqcArr[i].val/100});
        }
      }
      else{
        arr.push({t:ts+susOff, y:this.sqcArr[i].val/100});
        if(this.pointsPerBar>2){
          arr.push({t:ts+relOff, y:relBase*this.sqcArr[i].val/100})
        }
        if(this.pointsPerBar>3){
          arr.push({t:ts+t0, y:0})
        }
      }
    }

    //repeat
    while(arr[arr.length-1].t <= this.maxLen){
      for(let i=0; i<this.seqNum*this.pointsPerBar; i++){
        arr.push({
          t:arr[arr.length-this.seqNum*this.pointsPerBar].t+t0*this.seqNum,
          y:arr[arr.length-this.seqNum*this.pointsPerBar].y
        });
      }
    }
    return arr;
  }
  drawCurve(){
    let canvas = document.getElementsByClassName(this.name+'-canvas')[0],
        ctx = canvas['getContext']('2d'),
        t0 = 1/this.freqSetting.value*this.seqNum,
        getT = (t) => {
          return t * (this.canvasW-2*this.canvasP) + this.canvasP
        },
        getY = (y) => {
          return (1-y) * (this.canvasH-2*this.canvasP) + this.canvasP
        };

    ctx.clearRect(0,0,this.canvasW, this.canvasH);

    // draw attack
    ctx.beginPath();
    ctx.moveTo(getT((this.sqcCurveArr[0].t)/t0), getY(this.sqcCurveArr[0].y));
    for(let i=0; i<=this.seqNum*this.pointsPerBar; i+=1){
      let pair = this.sqcCurveArr[i];
      ctx.lineTo(getT((pair.t)/t0), getY(pair.y));
    }
    ctx.strokeStyle='orange';
    ctx.lineWidth=1;
    ctx.stroke();
  }
}