import { Component } from '@angular/core';
import { Temperament, ToneFreqService} from './tone-freq.service';
import { SuperService } from '../../core/super.service';

@Component({
  selector : 'keyboard-container',
  templateUrl : './keyboard.component.html',
  styleUrls : ['./keyboard.component.css']
})
export class KeyboardComponent{

  keyGrp = [2,3,4,5];
  keySet = {white:['C', 'D', 'E', 'F', 'G', 'A', 'B'], black:['Db', 'Eb', 'Gb', 'Ab', 'Bb']};
  private latestKeyHash = {};
  private keyOnTouch = {};
  private toneService = null;
  private superService = null;
  private lastTone = null;
  private lastGrp = null;
  private isMobile = false;

  constructor(ts:ToneFreqService, ss:SuperService){
    this.toneService = ts;
    this.superService = ss;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
  }
  onMouseDown(e){
    if(this.isMobile) return;
    let k = e.currentTarget,
        tone = k.getAttribute('tone'),
        grp = k.getAttribute('grp'),
        hash = this.getHash(grp + tone);

    this.latestKeyHash[grp + tone] = hash;
    this.lastTone = tone;
    this.lastGrp = grp;
    this.keydown(tone, grp, hash);
  }
  onMouseUp(e){
    if(this.isMobile) return;
    let grp = this.lastGrp || '',
        tone = this.lastTone || '',
        hash = this.latestKeyHash[grp + tone] || '';

    if(grp && tone && hash){
      this.lastTone = null;
      this.lastGrp = null;
      this.latestKeyHash[grp + tone] = null;
      this.keyup(tone, grp, hash);
    }
  }
  onTouchStart(e){
    for(let i=0; i<e.changedTouches.length; i++){
      let target = e.changedTouches[i].target,
          identifier = e.changedTouches[i].identifier;
      if(target == e.target){
        let t = this.getRealKeyTarget(target),
            tone = t.getAttribute('tone'),
            grp = t.getAttribute('grp');

        if(!this.keyOnTouch[grp + tone]){
          let hash = this.getHash(grp + tone);
          this.keyOnTouch[grp + tone] = identifier;
          this.latestKeyHash[grp + tone] = hash;
          this.keydown(tone, grp, hash);
        }
      }
    }
    
  }
  onTouchEnd(e){
    for(let i=0; i<e.changedTouches.length; i++){
      let target = e.changedTouches[i].target,
          identifier = e.changedTouches[i].identifier;

      for(let k in this.keyOnTouch){
        let id = this.keyOnTouch[k];

        if(id == identifier){
          this.keyOnTouch[k] == null;
          let t = this.getRealKeyTarget(target),
              tone = t.getAttribute('tone'),
              grp = t.getAttribute('grp');

          let hash = this.latestKeyHash[grp + tone] || '';
          if(tone && grp && hash){
            this.latestKeyHash[grp + tone] = null;
            this.keyup(tone, grp, hash);
          }
          break;
        }
      }
    }
  }
  onTouchMove(e){
    e.preventDefault();
  }
  private getRealKeyTarget(t){
    if(t.tagName.toUpperCase() == 'SUB'){
      return t.parentNode;
    }
    return t;
  }
  private keydown(tone, grp, hash){
    let freq = this.toneService.getToneFreq(grp, tone);
    this.superService.keydown({hash:hash , freq: freq});
    console.log('[Keyboard]: KeyDown '+tone+grp);
  }
  private keyup(tone, grp, hash){
    this.superService.keyup({hash:hash});
    console.log('[Keyboard]: KeyUp '+tone+grp);
  }
  private getHash(index :string) :number{
    let t = new Date().getTime();
    return this.times33(index+t);
  }
  private times33 = function(str) {
    var str = str || '';
    var hash = 5381;
    for (var i = 0, len = str.length; i < len; ++i) {
      hash += (hash << 5) + str.charCodeAt(i);
    }
    return hash & 0x7fffffff;
  }
  
}