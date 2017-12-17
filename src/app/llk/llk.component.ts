import { Component, OnInit, OnDestroy } from '@angular/core';
import { SuperService }      from '../core/super.service';

@Component({
  // selector: 'llk-container',
  templateUrl: './llk.component.html',
  styleUrls: ['./llk.component.css']
})
export class LlkComponent implements OnInit, OnDestroy{
  matrix = [];
  rows = 10;
  cols = 14;
  diff = 33;
  slt1 = null;
  audioCtx = null;
  cmp = null;

  constructor(sp: SuperService){
    this.audioCtx = sp.getAudioContext();
  }
  ngOnInit(){
    this.init(this.cols, this.rows, this.diff);
    let cmp = this.audioCtx.createDynamicsCompressor();
    cmp.threshold.value = -20;
    cmp.knee.value = 40;
    cmp.ratio.value = 8;
    cmp.attack.value = 0;
    cmp.release.value = 0.25;
    this.cmp = cmp;
    cmp.connect(this.audioCtx.destination);
  }
  ngOnDestroy(){
    this.cmp.disconnect();
    this.cmp = null;
  }
  init(x, y, diffNum){
    var typeArr = [];
    for(var k=0; k<diffNum; k++){
      typeArr.push(k);
    }
    var arr = [];
    for(var i=0; i<x; i++){
      for(var j=0; j<y; j+=2){
        var type = Math.floor(Math.random()*diffNum);
        if(typeArr.length>0){
          type = typeArr.pop();
        }
        arr.push({x:i, y:j, type:type});
        arr.push({x:i, y:j+1, type:type});
      }
    }
    this.matrix = this.shuffle(arr);
    this.prepare();
  }
  shuffle(arr){
    console.log('%c[LLK] Shuffling...', 'color:#4880c3;');
    var newArr = [];
    for(let i=0; i<arr.length; i++){
      newArr.push({x:arr[i].x, y:arr[i].y});
    }
    while(arr.length>0){
      var l = arr.length,
          x = arr[l-1].x,
          y = arr[l-1].y,
          i = Math.floor(Math.random()*l),
          item = arr.splice(i, 1)[0];

      newArr[l-1].type = item.type;
    }
    return newArr;
  }
  checkSolvable(){
    for(var i in this.matrix){
      var founds = this.findPairs(i);
      if(founds.length>0){
        let str = '';
        for(let j in founds[0].p){
          str += '('+ founds[0].p[j].x +','+ founds[0].p[j].y +') ';
        }
        console.log('%c[LLK] Found Path => '+str, 'color:#4880c3;');
        return true;
      }
    }
    return false;
  }
  imgClick(x, y, e){
    var ind = this.getImg(x, y);
    if(this.slt1 == null){
      this.slt1 = ind;
      this.matrix[ind].active = true;
    }
    else if(this.slt1 == ind){
    }
    else{
      var path = this.getPath(this.slt1, ind);
      if(path != null){
        this.drawPath(path);
        var min = Math.min(+ind, this.slt1),
            max = Math.max(+ind, this.slt1);
        this.matrix.splice(max, 1);
        this.matrix.splice(min, 1);
        this.prepare();

        this.sound(1320, .5, 0)
        .then(()=>{
          this.sound(261.9, .4, 0);
          return this.sound(784, .3, 80);
        })
        .then(()=>{
          this.sound(523.8, .6, 80);
          return this.sound(1047.6, .3, 80);
        });
        this.slt1 = null;
        for(var i in this.matrix){
          this.matrix[i].active = false;
        }
      }
      else{
        this.slt1 = ind;
        for(var i in this.matrix){
          this.matrix[i].active = false;
        }
        this.matrix[ind].active = true;
      }
      
    }
  }
  drawPath(arr){
    let canvas = document.getElementsByClassName('canvas')[0],
        ctx = canvas['getContext']('2d');

    // draw attack
    ctx.beginPath();
    ctx.moveTo(25+50*(1+arr[0].x), 25+50*(1+arr[0].y));
    for(let i=1; i<arr.length; i+=1){
      ctx.lineTo(25+50*(1+arr[i].x), 25+50*(1+arr[i].y))
    }
    ctx.strokeStyle='orange';
    ctx.lineWidth=2;
    ctx.stroke();
    setTimeout(()=>{
      ctx.clearRect(0,0, 800, 600);
    }, 1000);
  }
  sound(frequency, loudness, when){
    let audioCtx = this.audioCtx,
        cmp = this.cmp;
    return new Promise(function (resolve, reject) {     
      setTimeout(()=>{
        let osc = audioCtx.createOscillator(),
            amp = audioCtx.createGain();

        osc.connect(amp);
        amp.connect(cmp);
        osc.type = 'triangle';
        osc.frequency.value = frequency;
        amp.gain.setValueAtTime(0, audioCtx.currentTime);
        amp.gain.linearRampToValueAtTime(loudness, audioCtx.currentTime + 0.01);
        osc.start(audioCtx.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + .7);
        osc.stop(audioCtx.currentTime + .8);
        osc.onended = () => {
          osc.disconnect();
          amp.disconnect();
        };
        resolve();
      }, when)
    });
  }
  prepare(){
    if(this.matrix.length){
      while(!this.checkSolvable()){
        this.matrix = this.shuffle(this.matrix);
      }
    }
  }
  getPath(ind, tgt){
    var founds = this.findPairs(ind);
    for(var i in founds){
      if(founds[i].i==tgt){
        return founds[i].p;
      }
    }
    return null;
  }
  findPairs(i){
    var type = this.matrix[i].type,
        x0 = this.matrix[i].x,
        y0 = this.matrix[i].y,
        founds = [];

    //find straight
    var fst = this.findStraight(x0, y0, 'all');
    for(let x=0; x<fst.m.length; x++){
      let ind = fst.m[x];
      if(this.matchImg(ind, type)){
        let path = [{x:x0, y:y0}];
        path.push({x:this.matrix[ind].x, y:this.matrix[ind].y});
        founds.push({p:path, i:ind});
      }
    }

    for(let i=0; i<fst.p.length; i++){
      //with one corner
      let p2 = fst.p[i],
          snd = this.findStraight(p2.x, p2.y, p2.ck);
      
      for(let x=0; x<snd.m.length; x++){
        let ind = snd.m[x];
        if(this.matchImg(ind, type)){
          let path = [{x:x0, y:y0}];
          path.push({x:p2.x, y:p2.y});
          path.push({x:this.matrix[ind].x, y:this.matrix[ind].y});
          founds.push({p:path, i:ind});
        }
      }
      for(let j=0; j<snd.p.length; j++){
        let p3 = snd.p[j],
            trd = this.findStraight(p3.x, p3.y, p3.ck);       
        for(let x=0; x<trd.m.length; x++){
          let ind = trd.m[x];
          if(this.matchImg(ind, type)){
            let path = [{x:x0, y:y0}];
            path.push({x:p2.x, y:p2.y});
            path.push({x:p3.x, y:p3.y});
            path.push({x:this.matrix[ind].x, y:this.matrix[ind].y});
            founds.push({p:path, i:ind});
          }
        }
      }
    }
    return founds;
  }
  findStraight(x0, y0, ck){
    var path = [],
        match = [];

    if( ck=='all' || ck=='x' ){
      let x = x0+1;
      while(x <= this.cols && this.getImg(x, y0) == null){
        path.push({x:x, y:y0, ck:'y'});
        x += 1;
      }
      if(x < this.cols){
        match.push(this.getImg(x, y0));
      }

      x = x0-1;
      while(x >= -1 && this.getImg(x, y0) == null){
        path.push({x:x, y:y0, ck:'y'});
        x -= 1;
      }
      if(x >= 0){
        match.push(this.getImg(x, y0));
      }
    }

    if( ck=='all' || ck=='y'){
      let y = y0+1;
      while(y <= this.rows && this.getImg(x0, y) == null){
        path.push({x:x0, y:y, ck:'x'});
        y += 1;
      }
      if(y < this.rows){
        match.push(this.getImg(x0, y));
      }

      y = y0-1;
      while(y >= -1 && this.getImg(x0, y) == null){
        path.push({x:x0, y:y, ck:'x'});
        y -= 1;
      }
      if(y >= 0){
        match.push(this.getImg(x0, y));
      }
    }
    return {p:path, m:match};
  }
  getImg(x, y){
    for(let i in this.matrix){
      if(x == this.matrix[i].x && y == this.matrix[i].y)
        return i;
    }
    return null;
  }
  matchImg(i, type){
    if(i==null){
      return false;
    }
    return this.matrix[i].type == type;
  }
}