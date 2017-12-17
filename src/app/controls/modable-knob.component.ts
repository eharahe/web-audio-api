import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OnInit, DoCheck, AfterViewInit } from '@angular/core';

import * as d3 from "d3"
import { KnobSettings } from './knob';
import { MappingType, ValueMappingService} from '../core/value-mapping.service';
import { SuperService } from '../core/super.service';
import { SimpleKnobComponent } from './simple-knob.component';

@Component({
  selector : 'modable-knob-container',
  templateUrl : './modable-knob.component.html',
  styleUrls: ['./modable-knob.component.css']
})
export class ModableKnobComponent extends SimpleKnobComponent implements OnInit, DoCheck, AfterViewInit {

  @Input()  settings : KnobSettings;
  @Output() onKnobDrag = new EventEmitter<number>();
  @Output() onModChange  = new EventEmitter<number>();

  mapService;
  superService;

  knobCtl;
  knobBtn;
  modBtn1;
  modBtn2;
  
  center = 50;
  modR1 = [35.5, 37.5];
  modR2 = [39, 41];
  modVal1 = 0;
  modVal2 = 0;

  modNames = [];
  
  constructor(map: ValueMappingService, ss:SuperService) {
    super(map);
    this.superService = ss;
  }

  ngOnInit(): void{
    this.settings.mods.push({id:'None', val:0});
    this.settings.mods.push({id:'None', val:0});
  }

  ngDoCheck(): void{
    let mods = this.superService.getMods();
    this.modNames = ['None'];
    for(let i in mods){
      this.modNames.push(i);
    }
  }

  ngAfterViewInit(): void {
    if(!this.settings.id){
        throw "[Modable Knob]: 'knob ID' must be set by parent component!";
    }
    
    this.knobCtl = d3.select('#'+ this.settings.id);
    this.knobBtn = this.knobCtl.select('.knob-btn');
    this.modBtn1 = this.knobCtl.select('.modg1-slider');
    this.modBtn2 = this.knobCtl.select('.modg2-slider');
    this.knobBtn.call(this.bindKnob());
    this.modBtn1.call(this.bindMod(0));
    this.modBtn2.call(this.bindMod(1));
    this.refKnobByVal();
    this.drawModPaths();
  }

  onModSelect (e, ind){
    this.settings.mods[ind].id = e.target.value;
    this.onModChange.emit();
  }
  protected bindKnob(){
    return  d3.drag()
      .on('drag', () => {
        let lastVal = this.settings.value,
            dy   = d3.event.dy,
            rate = 0.5 + 0.1* Math.min(dy * dy, 2),
            r    = Math.max(0, Math.min(300, + this.knobBtn.attr('rot') + dy * rate));

        this.setVal(r);
        this.refKnobByVal();
        if(this.settings.value != lastVal){
          this.onKnobDrag.emit();
          this.onModChange.emit();
          this.refMod(0);
          this.refMod(1);
        }
      })
  }
  private bindMod(ind){
    return  d3.drag()
      .on('drag', () => {

        let lastVal = this.settings.mods[ind].val,
            dy   = d3.event.dy,
            rate = 0.5 + 0.1* Math.min(dy * dy, 2),
            newVal = Math.max(-100, Math.min(100, + lastVal + dy * rate));

        this.settings.mods[ind].val = +newVal.toFixed(0);
        if(this.settings.mods[ind].val != lastVal){
          this.onModChange.emit();
          this.refMod(ind);
        }
      })
      // .on('end', () => {
      //   console.log(this.settings.mods);
      // })
  }
  private refMod(ind){
    this.drawModArc(this.settings.mods[ind].val, 1+ind);
  }
  private drawModPaths(){
    let p1 = this.knobCtl.select('.mod-path1'),
        p2 = this.knobCtl.select('.mod-path2');
    
    p1.append('path')
      .attr('d', this.getArc(this.modR1[0], this.modR1[1], Math.PI * (4/3), Math.PI * (-1/3)));
    p2.append('path')
      .attr('d', this.getArc(this.modR2[0], this.modR2[1], Math.PI * (-1/3), Math.PI * (4/3)));
  }
  private drawModArc(pst, index){
    let ang1 = Math.PI * (240 - this.getKnobDeg(this.settings.value)) / 180,
        ang2 = Math.min(Math.max(Math.PI*(-1/3), ang1 - Math.PI * (5/3) * pst/100), Math.PI * (4/3));

    let p = this.knobCtl.select('.mod-path'+index),
        path = p.selectAll('.mod-arc');

    if(!path.node()){
      path = p.append('path')
              .attr('class', 'mod-arc')
              .attr('fill', index==1 ? 'orange':'#add8e6');
    }
    path.attr('d',this.getArc(this['modR'+index][0], this['modR'+index][1],  ang1, ang2));
  }
  private getArc(r1, r2, ang1, ang2){
    if(ang1 > ang2){
      [ang1, ang2] = [ang2, ang1];
    }
    let largeArc = (Math.abs(ang2 - ang1) > Math.PI) ? 1 : 0,
        p1x = 50 + r1 * Math.cos(ang1),
        p1y = 50 - r1 * Math.sin(ang1),
        p2x = 50 + r1 * Math.cos(ang2),
        p2y = 50 - r1 * Math.sin(ang2),
        p3x = 50 + r2 * Math.cos(ang1),
        p3y = 50 - r2 * Math.sin(ang1),
        p4x = 50 + r2 * Math.cos(ang2),
        p4y = 50 - r2 * Math.sin(ang2);

    return `m${p1x} ${p1y} A${r1} ${r1} 0 ${largeArc} 0 ${p2x} ${p2y} `+
           `L${p4x} ${p4y} A${r2} ${r2} 0 ${largeArc} 1 ${p3x} ${p3y}z`;
  }

  // private bindEvents(){
  //   return  d3.drag()
  //             .on('start', () => {
  //               this.setVal(0);
  //               this.onStart.emit(this.settings.value);
  //             })
  //             .on('drag', () => {
  //               let dy   = d3.event.dy,
  //                   rate = 0.5 + Math.min(dy * dy, 2),
  //                   r    = Math.max(0, Math.min(300, + this.knobBtn.attr('rot') + dy * rate));

  //               this.setVal(r);
  //               this.refKnobByVal();
  //               this.onDrag.emit(this.settings.value);
  //             })
  //             .on('end', () => {
  //               this.onEnd.emit(this.settings.value);
  //             });
  // }

  // private refKnobByVal(){
  //   let deg = this.getKnobDeg(this.settings.value);
  //   this.knobBtn.attr('rot', deg)
  //                .attr('transform', 'rotate('+ deg +','+this.center+' '+this.center+')');
  // }

  // private setVal(deg){
  //   let min = this.settings.range[0],
  //       max = this.settings.range[1],
  //       delta = this.mapService.map(deg / 300, this.settings.mapping),
  //       val = min + (max - min) * delta;

  //   if(this.settings.step > 0){
  //     this.settings.value = Math.round(val / this.settings.step) * this.settings.step;
  //   }
  //   else{
  //     this.settings.value = +val.toFixed(3);
  //   }
  // }

  // private getKnobDeg(val){
  //   let min = this.settings.range[0],
  //       max = this.settings.range[1],
  //       c = (val - min) / (max - min);

  //   return this.mapService.unMap(c, this.settings.mapping) * 300;
  // }
}