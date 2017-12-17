import { Component, Input, AfterViewInit } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { FilterComponent } from './filter.component';

@Component({
  templateUrl: './wave-shaper-filter.component.html',
  styleUrls: ['./filter-panel.component.css']
})
export class WaveShaperFilterComponent extends FilterComponent implements AfterViewInit{
  @Input() name = 'WS';
  @Input() settings;
  canvasW = 124;
  canvasH = 124;
  canvasP = 2;
  n_samples = 44100;

  ngAfterViewInit(){
    this.onDrag();
  }
  onDrag(){
    this.settings.curve = this.makeDistortionCurve(this.settings.amount.value);
    this.drawCurve(this.settings.curve);
    this.onFChange();
  }
  makeDistortionCurve(amount) {
    let k = typeof amount === 'number' ? amount : 50,
        curve = new Float32Array(this.n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for ( ; i < this.n_samples; ++i ) {
      x = i * 2 / this.n_samples - 1;
      curve[i] = ( 3 + k ) * x * 57.3 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
  }

  drawCurve(cv){
    let canvas = document.getElementsByClassName(this.name+'-canvas')[0],
        ctx = canvas['getContext']('2d'),
       
        getT = (t) => {
          return t * (this.canvasW-2*this.canvasP) + this.canvasP
        },
        getY = (y) => {
          return (1-y) * (this.canvasH-2*this.canvasP) + this.canvasP
        };

    ctx.clearRect(0,0,this.canvasW, this.canvasH);

    // draw axis
    ctx.beginPath();
    ctx.moveTo(getT(0), getY(0));
    ctx.lineTo(getT(1), getY(0));
    ctx.lineTo(getT(1), getY(1));
    ctx.lineTo(getT(0), getY(1));
    ctx.closePath();
    ctx.strokeStyle='rgba(139, 170, 188, .8)';
    ctx.lineWidth=.5;
    ctx.stroke();

    // draw attack
    ctx.beginPath();
    ctx.moveTo(getT(0), getY(0.5*cv[0]+0.5));
    for(let i=0; i<=cv.length; i+=1){
      ctx.lineTo(getT(i/this.n_samples), getY(0.5*cv[i]+0.5));
    }
    ctx.strokeStyle='orange';
    ctx.lineWidth=1;
    ctx.stroke();
  }
}