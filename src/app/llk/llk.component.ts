import { Component, OnInit, OnDestroy } from '@angular/core';
import { SuperService }      from '../core/super.service';

enum Direction {
  Up,
  Down,
  Left,
  Right
}
@Component({
  // selector: 'llk-container',
  templateUrl: './llk.component.html',
  styleUrls: ['./llk.component.css']
})
export class LlkComponent implements OnInit, OnDestroy{
  cardSet = [];
  matrix = [];
  cardWidth = 70;
  hintNum = 4;
  founds = null;
  scaleRatio = 1;
  rows = 8; //must be even
  cols = 14;
  diff = 33;
  life = 1;
  slt1 = null;
  audioCtx = null;
  cmp = null;
  currentLevel = 0;
  billboard = '';
  status = 0; //0-playing 1-level-passed 2-all-passed 3-dead 4-paused
  defaultTime = 300;
  time = 0;
  timmer = null;
  levels = [
    {
      name:'第1关 - 非常简单',
      diff: 24,
      sortOut: ()=>{},
    },
    {
      name:'第2关 - 增加难度',
      diff: 30,
      sortOut: ()=>{}
    },
    {
      name:'第3关 - 左右分离',
      diff: 33,
      sortOut: ()=>{
        let splitX = Math.ceil(this.cols/2);
        this.collapse(0, splitX, 0, this.rows, Direction.Left);
        this.collapse(splitX, this.cols, 0, this.rows, Direction.Right);
      }
    },
    {
      name:'第4关 - 上下分离',
      diff: 33,
      sortOut: ()=>{
        let splitY = Math.ceil(this.rows/2);
        this.collapse(0, this.cols, 0, splitY, Direction.Up);
        this.collapse(0, this.cols, splitY, this.rows, Direction.Down);
      }
    },
    {
      name:'第5关 - 向左看齐',
      diff: 33,
      sortOut: ()=>{
        this.collapse(0, this.cols, 0, this.rows, Direction.Left);
      }
    },
    {
      name:'第6关 - 万有引力',
      diff: 33,
      sortOut: ()=>{
        this.collapse(0, this.cols, 0, this.rows, Direction.Down);
      }
    },
    {
      name:'第7关 - 向右看齐',
      diff: 33,
      sortOut: ()=>{
        this.collapse(0, this.cols, 0, this.rows, Direction.Right);
      }
    },
    {
      name:'第8关 - 飘向天空',
      diff: 33,
      sortOut: ()=>{
        this.collapse(0, this.cols, 0, this.rows, Direction.Up);
      }
    },
    {
      name:'第9关 - 向中靠拢',
      diff: 33,
      sortOut: ()=>{
        let splitX = Math.ceil(this.cols/2);
        this.collapse(0, splitX, 0, this.rows, Direction.Right);
        this.collapse(splitX, this.cols, 0, this.rows, Direction.Left);

        this.refMatrix();
        let splitY = Math.ceil(this.rows/2);
        this.collapse(0, this.cols, 0, splitY, Direction.Down);
        this.collapse(0, this.cols, splitY, this.rows, Direction.Up);
      }
    }
  ];
  
  constructor(sp: SuperService){
    this.audioCtx = sp.getAudioContext();
  }
  ngOnInit(){
    if(window.innerWidth < (this.cardWidth*(this.cols+2))){
      this.scaleRatio = window.innerWidth / (this.cardWidth*(this.cols+2));
    }
    let cmp = this.audioCtx.createDynamicsCompressor();
    cmp.threshold.value = -20;
    cmp.knee.value = 40;
    cmp.ratio.value = 8;
    cmp.attack.value = 0;
    cmp.release.value = 0.25;
    this.cmp = cmp;
    cmp.connect(this.audioCtx.destination);
    this.initLevel();
  }
  ngOnDestroy(){
    this.cmp.disconnect();
    this.cmp = null;
    this.endTimmer();
  }
  initLevel(){
    if(this.currentLevel<this.levels.length){
      let lv = this.levels[this.currentLevel];
      this.init(this.cols, this.rows, lv.diff);
      this.time = this.levels[this.currentLevel]['time'] || this.defaultTime;
      this.startTimmer();
    }
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
        arr.push({x:i, y:j, type:type, hint:false});
        arr.push({x:i, y:j+1, type:type, hint:false});
      }
    }
    this.cardSet = this.shuffle(arr);
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
      newArr[l-1].hint = item.hint;
    }
    return newArr;
  }
  checkSolvable(){
    for(var i in this.cardSet){
      var founds = this.findPairs(i);
      if(founds.length>0){
        let str = '';
        for(let j in founds[0].p){
          str += '('+ founds[0].p[j].x +','+ founds[0].p[j].y +') ';
        }
        this.founds = founds[0].p;
        console.log('%c[LLK] Found Path => '+str, 'color:#4880c3;');
        return true;
      }
    }
    return false;
  }
  imgClick(x, y, e){
    var ind = this.getCard(x, y);
    this.unhint();
    if(this.slt1 == null){
      this.slt1 = ind;
      this.cardSet[ind].active = true;
    }
    else if(this.slt1 == ind){
    }
    else{
      var path = this.getPath(this.slt1, ind);
      if(path != null){
        this.drawPath(path);
        var min = Math.min(+ind, this.slt1),
            max = Math.max(+ind, this.slt1);
        this.cardSet.splice(max, 1);
        this.cardSet.splice(min, 1);
        this.prepare();
        this.time = Math.min(this.levels[this.currentLevel]['time'] || this.defaultTime, this.time+3);
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
        for(var i in this.cardSet){
          this.cardSet[i].active = false;
        }
      }
      else{
        this.slt1 = ind;
        for(var i in this.cardSet){
          this.cardSet[i].active = false;
        }
        this.cardSet[ind].active = true;
      }
      
    }
  }
  drawPath(arr){
    let canvas = document.getElementsByClassName('canvas')[0],
        ctx = canvas['getContext']('2d');

    // draw attack
    ctx.beginPath();
    ctx.moveTo(this.cardWidth*(1.5+arr[0].x), this.cardWidth*(1.5+arr[0].y));
    for(let i=1; i<arr.length; i+=1){
      ctx.lineTo(this.cardWidth*(1.5+arr[i].x), this.cardWidth*(1.5+arr[i].y))
    }
    ctx.strokeStyle='orange';
    ctx.lineWidth=2;
    ctx.stroke();
    setTimeout(()=>{
      ctx.clearRect(0,0, this.cardWidth*(this.cols+2), this.cardWidth*(this.rows+2));
    }, 200);
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
        osc.type = 'sine';
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
    if(this.cardSet.length){
      this.refMatrix();
      this.levels[this.currentLevel].sortOut();
      while(!this.checkSolvable()){
        this.cardSet = this.shuffle(this.cardSet);
      }
    }
    else{
      this.levelPassed();
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
    var type = this.cardSet[i].type,
        x0 = this.cardSet[i].x,
        y0 = this.cardSet[i].y,
        founds = [];

    //find straight
    var fst = this.findStraight(x0, y0, 'all');
    for(let x=0; x<fst.m.length; x++){
      let ind = fst.m[x];
      if(this.matchImg(ind, type)){
        let path = [{x:x0, y:y0}];
        path.push({x:this.cardSet[ind].x, y:this.cardSet[ind].y});
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
          path.push({x:this.cardSet[ind].x, y:this.cardSet[ind].y});
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
            path.push({x:this.cardSet[ind].x, y:this.cardSet[ind].y});
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
      while(x <= this.cols && this.getCard(x, y0) == null){
        path.push({x:x, y:y0, ck:'y'});
        x += 1;
      }
      if(x < this.cols){
        match.push(this.getCard(x, y0));
      }

      x = x0-1;
      while(x >= -1 && this.getCard(x, y0) == null){
        path.push({x:x, y:y0, ck:'y'});
        x -= 1;
      }
      if(x >= 0){
        match.push(this.getCard(x, y0));
      }
    }

    if( ck=='all' || ck=='y'){
      let y = y0+1;
      while(y <= this.rows && this.getCard(x0, y) == null){
        path.push({x:x0, y:y, ck:'x'});
        y += 1;
      }
      if(y < this.rows){
        match.push(this.getCard(x0, y));
      }

      y = y0-1;
      while(y >= -1 && this.getCard(x0, y) == null){
        path.push({x:x0, y:y, ck:'x'});
        y -= 1;
      }
      if(y >= 0){
        match.push(this.getCard(x0, y));
      }
    }
    return {p:path, m:match};
  }
  getCard(x, y){
    for(let i in this.cardSet){
      if(x == this.cardSet[i].x && y == this.cardSet[i].y)
        return i;
    }
    return null;
  }
  matchImg(i, type){
    if(i==null){
      return false;
    }
    return this.cardSet[i].type == type;
  }
  refMatrix(){
    for(let i=0; i<this.cols; i++){
      this.matrix[i] = [];
      for(let j=0; j<this.rows; j++){
        this.matrix[i][j] = -1;
      }
    }
    for(let i=0; i<this.cardSet.length; i++){
      let card = this.cardSet[i];
      this.matrix[card.x][card.y] = i;
    }
  }
  private collapse(x0, x1, y0, y1, direction:Direction){

    switch(direction){
      case Direction.Down:
        for(let i=x0; i<x1; i++){
          let gap=0;
          for(let j=y1-1; j>=y0; j--){
            let ind = this.matrix[i][j];
            if(ind==-1){
              gap++;
              continue;
            }
            if(gap>0){
              this.cardSet[ind].y += gap;
            }
          }
        }
        break;
      case Direction.Up:
        for(let i=x0; i<x1; i++){
          let gap=0;
          for(let j=y0; j<y1; j++){
            let ind = this.matrix[i][j];
            if(ind==-1){
              gap++;
              continue;
            }
            if(gap>0){
              this.cardSet[ind].y -= gap;
            }
          }
        }
        break;
      case Direction.Right:
        for(let i=y0; i<y1; i++){
          let gap=0;
          for(let j=x1-1; j>=x0; j--){
            let ind = this.matrix[j][i];
            if(ind==-1){
              gap++;
              continue;
            }
            if(gap>0){
              this.cardSet[ind].x += gap;
            }
          }
        }
        break;
      case Direction.Left:
        for(let i=y0; i<y1; i++){
          let gap=0;
          for(let j=x0; j<x1; j++){
            let ind = this.matrix[j][i];
            if(ind==-1){
              gap++;
              continue;
            }
            if(gap>0){
              this.cardSet[ind].x -= gap;
            }
          }
        }
        break;
    }
  }
  nextLvClick(){
    this.currentLevel++;
    this.hintNum += 2;
    this.initLevel();
    this.status = 0;
  }
  playAgainClick(){
    this.currentLevel = 0;
    this.hintNum = 4;
    this.initLevel();
    this.status = 0;
  }
  levelPassed(){
    this.endTimmer();
    if(this.currentLevel<this.levels.length-1){
      this.billboard = '恭喜通过：'+this.levels[this.currentLevel].name;
      this.status = 1;
    }
    else{
      this.billboard = '恭喜！您已经全部通关~';
      this.status = 2;
    }
  }
  startTimmer(){
    let loop = () =>{
      this.time-=0.5;
      if(this.time<0){ //dead
        this.endTimmer();
        this.billboard = '你屎了~';
        this.status = 3;
      }
      this.life = this.time/(this.levels[this.currentLevel]['time'] || this.defaultTime);
    }
    this.timmer = setInterval(loop, 500);
  }
  endTimmer(){
    clearInterval(this.timmer);
  }
  pause(){
    this.endTimmer();
    this.billboard = '思考一下人生~';
    this.status = 4;
  }
  resume(){
    this.startTimmer();
    this.status = 0;
  }
  hint(){
    if(this.hintNum>0 && this.founds){
      this.hintNum--;
      this.refMatrix();
      let i1 = this.matrix[this.founds[0].x][this.founds[0].y],
          i2 = this.matrix[this.founds[this.founds.length-1].x][this.founds[this.founds.length-1].y];
      this.cardSet[i1].hint = true;
      this.cardSet[i2].hint = true;
      this.founds = null;
    }
  }
  unhint(){
    for(let i=0; i<this.cardSet.length; i++){
      this.cardSet[i].hint=false;
    }
  }
}