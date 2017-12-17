import { Injectable } from '@angular/core';
import { Oscillator } from '../synthesizer/oscillator/oscillator';
import { mapVal, unMap, MappingType} from './value-mapping.service';
import { FilterType } from '../synthesizer/filters/filters';

function _window() : any {
   return window;
}
enum TonePhase{
  Attack,
  Release,
  Ended
}
class Tone {
  route: any;
  hash: number;
  freq: number;
  phase: TonePhase;
  attackTs: number;
  releaseTs: number;
}

@Injectable()
export class SuperService {
  private oscArr = {};
  private modArr = {};
  private filterArr = {};

  private toneWin : Array<Tone> = [];
  private polyphony = 1; //TODO
  private voicingSettingArr;
  private ctx;
  private serial;
  private delay: any = {};
  private convolver: any = {};
  private master: any = {};
  private masterModName = 'ADSR-M';
  private masterADSR = {
    range: [0, 1],
    value: 0,
    mapping: MappingType.Linear,
    mods: [{id:this.masterModName, val:100}]
  };

  constructor(){
    this.ctx = new (_window().AudioContext || _window().webkitAudioContext)();
    this.createMasterRoute();
    this.createConvolverRoute();
    this.createDelayRoute();
  }

  /***************************/
  /*  Keyboard Events        */
  /***************************/
  keydown(e){
console.log(e.freq)
    let toneInd = this.toneWin.length;
    if(toneInd < this.polyphony){ //Fill the Polyphony-Window
      let route = this.createRoute();
      this.toneWin.push({
        route: route
      } as Tone);
    }
    else{ //Seize by Idle -> OnRelease -> Oldest
      let ind = this.getIdleToneIndex(),
          idle = 0; //Oldest

      if(ind.rel >= 0 && ind.rel < this.polyphony){
        idle = ind.rel; //OnRelease
      }
      if(ind.idle >= 0 && ind.idle < this.polyphony){
        idle = ind.idle; //Idle
      }
      toneInd = this.polyphony - 1;
      let old = this.toneWin.splice(idle, 1)[0];
      this.toneWin.splice(toneInd, 0, old); //move the Idle-Tone to the tail
    }
    this.newTone(e, toneInd);
  }
  keyup(e){
    for(let i in this.toneWin){
      let tone = this.toneWin[i];
      if(tone.hash == e.hash){
        tone.phase = TonePhase.Release;
        tone.releaseTs = this.ctx.currentTime;
        for(let j in tone.route.oscs){
          let osc = tone.route.oscs[j],
              oscParam = this.oscArr[osc.id];

          this.refVoicingSettingArr(oscParam.voicing);
          this.oscVoicingCk(osc, tone, oscParam);

          this.oscVolCk(osc, tone, oscParam);
          this.oscPanCk(osc, tone, oscParam);
          this.oscTuneCk(osc, tone, oscParam);
          this.oscFineCk(osc, tone, oscParam);
          this.masterADSRCk(osc, tone);
        }
        this.filterSettingsCk(tone, 1);
        this.filterSettingsCk(tone, 2);
        this.filterMixCk(tone);
        break;
      }
    }
  }
  getAudioContext(){
    return this.ctx;
  }
  private getIdleToneIndex(){

    let idle = -1,
        onRelease = -1;

    for(let i=this.toneWin.length-1; i>=0; i-=1){ //backwards

      let tone = this.toneWin[i],
          now = this.ctx.currentTime,
          ku = this.modArr[this.masterModName].keyup,
          releaseLen = ku[ku.length-1].t; // in sec

      if(tone.phase != TonePhase.Release){
        continue;
      }
      onRelease = i;
      if(now-tone.releaseTs >= releaseLen){
        idle = i;
      }
    }
    return {idle: idle, rel: onRelease};
  }

  private createRoute(){
    let route = {
      oscs: [],
      filters: {
        f1PreAmp:this.ctx.createGain(),
        f2PreAmp:this.ctx.createGain(),
        f1:null,
        f2:null,
        f1PostAmp:this.ctx.createGain(),
        f2PostAmp:this.ctx.createGain(),
        serialAmp:this.ctx.createGain(),
        parallelAmp:this.ctx.createGain(),
        mixAmp:this.ctx.createGain()
      }
    };

    //osc
    for(let i in this.oscArr){
      let panNode = this.ctx.createStereoPanner(),
          gainNode = this.ctx.createGain(),
          masterADSRGain = this.ctx.createGain(),
          route2F1 = this.ctx.createGain(),
          route2F2 = this.ctx.createGain(),
          oscSplitter = this.ctx.createChannelSplitter(2);
          
      panNode.connect(gainNode);
      gainNode.connect(masterADSRGain);
      masterADSRGain.connect(oscSplitter);
      for(let a in this.oscArr[i].analysers){
        oscSplitter.connect(this.oscArr[i].analysers[a], +a);
      }

      //split
      masterADSRGain.connect(route2F1);
      masterADSRGain.connect(route2F2);

      route.oscs.push({id:i, pan:panNode, gain:gainNode, master:masterADSRGain, r2f1:route2F1, r2f2:route2F2, voices: []});

      //mix to filter
      route2F1.connect(route.filters.f1PreAmp);
      route2F2.connect(route.filters.f2PreAmp);
    }

    //filter
    route.filters.f1PreAmp.connect(route.filters.f1PostAmp);
    route.filters.f2PreAmp.connect(route.filters.f2PostAmp);

    route.filters.f1PostAmp.connect(route.filters.serialAmp);
    route.filters.f1PostAmp.connect(route.filters.parallelAmp);

    route.filters.serialAmp.connect(route.filters.f2PreAmp);
    route.filters.parallelAmp.connect(route.filters.mixAmp);
    route.filters.f2PostAmp.connect(route.filters.mixAmp);

    //analyser
    let filterSpl1 = this.ctx.createChannelSplitter(2),
        filterSpl2 = this.ctx.createChannelSplitter(2);
    route.filters.f1PostAmp.connect(filterSpl1);
    route.filters.f2PostAmp.connect(filterSpl2);
    for(let a in this.filterArr['Filter1'].analysers){
      filterSpl1.connect(this.filterArr['Filter1'].analysers[a], +a);
    }
    for(let a in this.filterArr['Filter2'].analysers){
      filterSpl2.connect(this.filterArr['Filter2'].analysers[a], +a);
    }

    route.filters.mixAmp.connect(this.delay.route.preAmp); //TODO
    return route;
  }

  private newTone(e, index){
    this.toneWin[index].phase = TonePhase.Attack;
    this.toneWin[index].hash = e.hash;
    this.toneWin[index].freq = e.freq;
    this.toneWin[index].attackTs = this.ctx.currentTime;
    this.toneWin[index].releaseTs = null;

    for(let i in this.toneWin[index].route.oscs){
      let osc = this.toneWin[index].route.oscs[i],
          oscParam = this.oscArr[osc.id];

      //clear voices
      if(osc.voices.length){
        for(let j in osc.voices){
          let refOsc = osc.voices[j].src,
              refGain = osc.voices[j].gain,
              refPan = osc.voices[j].pan,
              now = this.ctx.currentTime;

          refGain.gain.value = 0;
          refOsc.stop(now + 0.01);
          refOsc.onended = () => {
            refOsc.disconnect();
            refGain.disconnect();
            refPan.disconnect();
          };
          osc.voices[j].src = null;
          osc.voices[j].gain = null;
          osc.voices[j].pan = null;
          osc.voices[j] = null
        }
      }
      osc.voices = [];

      //creat voice-osc
      for(let k=0; k<oscParam.voicing.num.value; k+=1){
        let voice = this.ctx.createOscillator(),
            gain = this.ctx.createGain(),
            pan = this.ctx.createStereoPanner();

        let isUserWave = false;
        for(let u in oscParam.customTypes){
          let pw = oscParam.customTypes[u];
          if(oscParam.type == pw.name){
            isUserWave = true;
            voice.setPeriodicWave(this.ctx.createPeriodicWave(pw.wave.real, pw.wave.imag, {disableNormalization: true}))
          }
        }
        if(!isUserWave){
          voice.type = oscParam.type;
        }
        voice.connect(gain);
        gain.connect(pan);
        pan.connect(osc.pan)
        osc.voices.push({src: voice, gain: gain, pan: pan});
      }

      this.oscPowerCk(osc, this.toneWin[index], oscParam);

      this.refVoicingSettingArr(oscParam.voicing);
      this.oscVoicingCk(osc, this.toneWin[index], oscParam);

      this.oscTuneCk(osc, this.toneWin[index], oscParam);
      this.oscFineCk(osc, this.toneWin[index], oscParam);
      this.oscVolCk(osc, this.toneWin[index], oscParam);
      this.oscPanCk(osc, this.toneWin[index], oscParam);
      this.masterADSRCk(osc, this.toneWin[index]);
      this.oscMixCk(osc, this.toneWin[index], oscParam);
    }
    this.filterSerialCk(this.toneWin[index]);
    this.refreshFilter(this.toneWin[index], 1);
    this.filterSettingsCk(this.toneWin[index], 1);
    this.refreshFilter(this.toneWin[index], 2);
    this.filterSettingsCk(this.toneWin[index], 2);
    this.filterMixCk(this.toneWin[index]);

    //start the sound
    for(let i in this.toneWin[index].route.oscs){
      let osc = this.toneWin[index].route.oscs[i];
      for(let k=0; k<osc.voices.length; k+=1){
        osc.voices[k].src.start();
      }
    }
  }

  /***************************/
  /*  Oscillator             */
  /***************************/
  regOscRef(id: string, osRef: Oscillator){
    this.oscArr[id] = osRef;
    this.oscArr[id].analysers = this.createVolAnalyser(osRef.volMeter);
  }

  private createVolAnalyser(meter, envelope?){
    let analysers = [],
        sampleRate = this.ctx.sampleRate,
        chNum = meter.channels.length,
        bufferLength = 1024,
        dataArray = new Uint8Array(bufferLength);
    
    for(let i=0; i<chNum; i++){
      let analyser = this.ctx.createAnalyser();
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = bufferLength;
      analysers.push(analyser);
    }

    let loop = function() {
      let max = [];
      for(let i in analysers){
        max[i] = 0;
        analysers[i].getByteTimeDomainData(dataArray);
        for(let j=0; j<bufferLength; j++) {
          let v = Math.abs( dataArray[j] / 128.0 - 1);
          if(v>max[i]) {
            max[i] = v;
          }
        }
      }
      meter.channels = max;
      setTimeout(()=>{
        loop();
      }, 50);
    };
    loop();
    return analysers;
  }
  private execOscs(id, cb){
    let oscParam = this.oscArr[id];
    this.execTones((tone)=>{
      for(let j in tone.route.oscs){
        let osc = tone.route.oscs[j];
        if(osc.id == id){
          cb.call(this, osc, tone, oscParam)
          break;
        }
      }
    })
  }
  private execTones(cb){
    for(let i in this.toneWin){
      let tone = this.toneWin[i];
      if(tone.phase != TonePhase.Ended){
        cb.call(this, tone);
      }
    }
  }


  oscVoicingChange(id){
    this.execOscs(id, (osc, tone, oscParam) => {
      this.refVoicingSettingArr(oscParam.voicing);
      this.oscVoicingCk(osc, tone, oscParam);
      this.oscFineCk(osc, tone, oscParam);
    });
  }
  private oscVoicingCk(osc, tone, oscParam){
    for(let i in osc.voices){
      let setting = this.voicingSettingArr[i];
      // osc.voices[i].src.detune.value = (setting && setting['detune']) || 0;
      osc.voices[i].pan.pan.value = (setting && setting['pan']) || 0;
      osc.voices[i].gain.gain.value = (setting && setting['amp']) || 0;
    }
  }
  private refVoicingSettingArr(param){

    let num = param.num.value,
        detune = param.detune.value,
        pan = param.pan.value,
        seed = param.seed.value * 2 * Math.PI,
        arr = [{detune:0, pan:0, amp:1}];

    if(num <= 1){
      this.voicingSettingArr = arr;
      return;
    }
    let di = Math.PI / num;

    for(let i=1; i<num; i+=1){
      arr.push(
        {
          detune: detune * Math.sin(seed + di*i),
          pan: pan/100 * Math.sin(seed+di*i),
          amp: 1/num
        }
      );
    }
    this.voicingSettingArr = arr;
  }


  oscTuneChange(id){ 
    this.execOscs(id, this.oscTuneCk);
  }
  private oscTuneCk(osc, tone, oscParam){

    for(let i in osc.voices){
      let freq = osc.voices[i].src.frequency,
          val = oscParam.tune.coarse;

      this.setAudioParamAutomation(freq, tone, val, (v)=>{
        return tone.freq * Math.pow(2, v/12);
      });   
    }
  }
  oscFineChange(id){ 
    this.execOscs(id, this.oscFineCk);
  }
  private oscFineCk(osc, tone, oscParam){
    for(let i in osc.voices){
      let detune = osc.voices[i].src.detune,
          val = oscParam.tune.fine,
          setting = this.voicingSettingArr && this.voicingSettingArr[i],
          off = (setting && setting['detune']) || 0;

      this.setAudioParamAutomation(detune, tone, val, (v)=>v+off);
    }
  }
  
  oscPowerChange(id){
    this.execOscs(id, this.oscPowerCk);
  }
  private oscPowerCk(osc, tone, oscParam){
    if(oscParam.on){
      osc.pan.connect(osc.gain);
    }
    else{
      osc.pan.disconnect();
    }
  }


  oscPanChange(id){
    this.execOscs(id, this.oscPanCk);
  }
  private oscPanCk(osc, tone, oscParam){
    let param = osc.pan.pan,
        val = oscParam.pan;

    this.setAudioParamAutomation(param, tone, val, (v)=>v*0.01);
  }


  oscVolChange(id){
    this.execOscs(id, this.oscVolCk);
  }
  private oscVolCk(osc, tone, oscParam){
    let param = osc.gain.gain,
        val = oscParam.vol;

    this.setAudioParamAutomation(param, tone, val);
  }

  oscMixChange(id){
    this.execOscs(id, this.oscMixCk);
  }
  private oscMixCk(osc, tone, oscParam){
    osc.r2f1.gain.value = oscParam.mix.value;
    osc.r2f2.gain.value = 1 - oscParam.mix.value;
  }

  /***************************/
  /*  Modulator              */
  /***************************/
  private getModValArr(phase, param, attTs, relTs){

    let sumArr = {},
        valArr = [],
        adsrTOff = (relTs && relTs-attTs) || 0;

    //interpolate
    for(let i in param.mods){
      if(param.mods[i].id == 'None'){
        continue;
      }
      let mod = this.modArr[param.mods[i].id];
      switch(mod.type){
        case 'adsr':
          if(phase == TonePhase.Attack){
            for(let j in mod.keydown){
              let t = mod.keydown[j].t;
              t = t.toFixed(5);
              sumArr[t] = 0;
            }
          }
          else if(phase == TonePhase.Release){
            for(let j in mod.keyup){
              let t = mod.keyup[j].t + adsrTOff;
              t = t.toFixed(5);
              sumArr[t] = 0;
            }
          }
          break;
        case 'lfo':
        case 'sqc':
          for(let j in mod.arr){
            let t = mod.arr[j].t;
            t = t.toFixed(5);
            sumArr[t] = 0;
          }
          break;
      }
    }

    //addup
    for(let i in sumArr){
      let ti = +i;
      for(let k in param.mods){
        if(param.mods[k].id == 'None'){
          continue;
        }
        let mod = this.modArr[param.mods[k].id],
            mul = param.mods[k].val/100;

        switch(mod.type){
          case 'adsr':
            if(phase == TonePhase.Attack){
              let addup = this.getModAddup(mod.keydown, mul, ti, 0);
              sumArr[i] += addup;
            }
            else if(phase == TonePhase.Release){
              let currentVal = this.getCurrAdsr(mod.keydown, attTs),
                  addup = this.getModAddup(mod.keyup, mul, ti, adsrTOff);

              sumArr[i] += currentVal * addup;
            }
            break;
          case 'lfo':
          case 'sqc':
            let addup = this.getModAddup(mod.arr, mul, ti, 0);
            sumArr[i] += addup;
        }
      }
    }
    //convert
    for(let i in sumArr){
      let cul = param.value,
          min = param.range[0],
          max = param.range[1],
          c = (cul - min) / (max - min),
          deg = unMap(c, param.mapping) * 300;

      let newDeg = Math.min(Math.max(0, deg + sumArr[i]*300), 300);
      let delta = mapVal(newDeg/300, param.mapping),
          val = min + (max - min) * delta;
      valArr.push({toff:i, val:val});
    }
    return valArr;
  }

  private getCurrAdsr(arr, attTs){
    let now = this.ctx.currentTime,
        off = now - attTs;

    for(let i=0; i<arr.length; i++){
      let t1 = arr[i].t,
          y1 = arr[i].y;
      if(t1 >= off){
        let t0 = i>0 ? arr[i-1].t : 0,
            y0 = i>0 ? arr[i-1].y : 0;
        return (y1-y0)*(off-t0)/(t1-t0) + y0;
      }
    }
    return arr[arr.length-1].y;
  }
  private getModAddup(arr, mul, ti, off){
    let j=0;
    for(; j<arr.length; j++){
      let t = arr[j].t+off,
          y = arr[j].y;

      if(t>=+ti){
        if(j==0){
          return y * mul;
        }
        else{
          let t0 = arr[j-1].t+off,
              y0 = arr[j-1].y;
          return ((y - y0) * (ti - t0) / (t - t0) + y0) * mul;
        }
      }
    }
    if(j==arr.length){
      let y = arr[j-1].y;
      return y * mul;
    }
  }

  private setAudioParamAutomation(audioParam, tone, knobSettings, paramMap = (v)=>v){
      
    let now = this.ctx.currentTime,
        arr = this.getModValArr(tone.phase, knobSettings, tone.attackTs, tone.releaseTs);

    // if(tone.phase == TonePhase.Release && knobSettings.id == 'OSC1-amp'){
    //   let iii =audioParam.value - (arr[0] && arr[0].val);
    //   console.log(iii.toFixed(5));
    // }
    // if(tone.phase == TonePhase.Attack && knobSettings.id == 'OSC1-amp'){
    //   console.log(arr);
    // }
    // IE does not support AudioParam
    audioParam.cancelAndHoldAtTime && audioParam.cancelAndHoldAtTime(now);
    audioParam.cancelScheduledValues && audioParam.cancelScheduledValues(now);
    if(arr.length == 0){
      audioParam.linearRampToValueAtTime(paramMap(knobSettings.value), now+0.000333);
    }
    else{
      let triggered = false;
      for(let i=0; i<arr.length; i++){
        if(+arr[i].toff+tone.attackTs > now){
          triggered = true;
          audioParam.linearRampToValueAtTime(paramMap(arr[i].val), +arr[i].toff+tone.attackTs);
        }
      }
      if(!triggered){
        audioParam.linearRampToValueAtTime(paramMap(knobSettings.value), now+0.000333);
      }
    }
  }

  regModRef(id: string, modRef: any){
    this.modArr[id] = modRef;
  }
  getModById(id){
    return this.modArr[id];
  }
  getMods(){
    return this.modArr;
  }

  /***************************/
  /*  Filter                 */
  /***************************/
  regFilterSerialRef(serial){
    this.serial = serial;
  }
  filterSerialChange(){
    this.execTones(this.filterSerialCk);
  }
  private filterSerialCk(tone){
    tone.route.filters.serialAmp.gain.value = this.serial.value;
    tone.route.filters.parallelAmp.gain.value = 1 - this.serial.value;
  }
  filterChange(name, type, filterSettings, volMeter){
    if(this.filterArr[name] == undefined){
      this.filterArrInit(name, volMeter);
    }
    let prevType = this.filterArr[name].type,
        index = (name == 'Filter1') ? 1 : 2;

    this.filterArr[name].type = type;
    this.filterArr[name].settings = filterSettings;
    this.execTones((tone)=>{
      if( prevType != type){
        this.refreshFilter(tone, index);
      }
      this.filterSettingsCk(tone, index);
    });
  }
  private filterArrInit(name, volMeter){
    this.filterArr[name] = {
      type:null,
      settings: null,
      analysers: this.createVolAnalyser(volMeter),
      mix: 1
    }
  }
  private refreshFilter(tone, index){
    let filter = tone.route.filters['f'+index],
        type = this.filterArr['Filter'+index].type;

    //clear;
    filter && filter.disconnect();
    filter = null;
    switch(+type){
      case FilterType.None:
        break;
      case FilterType.LP2:
        filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        break;
      case FilterType.HP2:
        filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        break;
      case FilterType.BP2:
        filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        break;
      case FilterType.Compressor:
        filter = this.ctx.createDynamicsCompressor();
        break;
      case FilterType.WS:
        filter = this.ctx.createWaveShaper();
        break;
    }
    tone.route.filters['f'+index] = filter;
    this.reconnectFilter(tone.route.filters, index, type);
  }
  private reconnectFilter(filters, index, type){
    filters['f'+index+'PreAmp'].disconnect();
    switch(+type){
      case FilterType.None:
        filters['f'+index+'PreAmp'].connect(filters['f'+index+'PostAmp']);
        break;
      default:
        filters['f'+index+'PreAmp'].connect(filters['f'+index]);
        filters['f'+index].connect(filters['f'+index+'PostAmp']);
        break;
    }
  }
  private filterSettingsCk(tone, index){
    let filter = tone.route.filters['f'+index],
        settings = this.filterArr['Filter'+index].settings,
        type = this.filterArr['Filter'+index].type;

    switch(+type){
      case FilterType.None:
        break;
      case FilterType.LP2:
      case FilterType.HP2:
      case FilterType.BP2:
        this.setAudioParamAutomation(filter.frequency, tone, settings.freq);
        this.setAudioParamAutomation(filter.detune, tone, settings.detune);
        this.setAudioParamAutomation(filter.Q, tone, settings.q);
        // filter.frequency.value = settings.freq.value;
        // filter.detune.value = settings.detune.value;
        // filter.Q.value = settings.q.value;
        break;
      case FilterType.Compressor:
        filter.threshold.value = settings.threshold.value;
        filter.knee.value = settings.knee.value;
        filter.ratio.value = settings.ratio.value;
        filter.attack.value = settings.attack.value;
        filter.release.value = settings.release.value;
        // console.log(filter.reduction);
        break;
      case FilterType.WS:
        filter.curve = settings.curve;
        break;
    }
  }

  filterMixChange(name, mixParam, volMeter){
    if(this.filterArr[name] == undefined){
      this.filterArrInit(name, volMeter);
    }
    this.filterArr[name].mix = mixParam.value;
    this.execTones(this.filterMixCk);
  }
  private filterMixCk(tone){
    tone.route.filters.f1PostAmp.gain.value = this.filterArr['Filter1'].mix;
    tone.route.filters.f2PostAmp.gain.value = this.filterArr['Filter2'].mix;
  }

  // Mastering
  regDelayRef(settings){
    this.delay.delayRef = settings;
    this.onDelayChange();
  }
  private createDelayRoute(){
    let r:any = {},
        maxDelayTime = 5.0;

    r.preAmp = this.ctx.createGain();
    r.dryAmp = this.ctx.createGain();
    r.wetAmp = this.ctx.createGain();
    r.mixAmp = this.ctx.createGain();
    r.panL = this.ctx.createStereoPanner(),
    r.panR = this.ctx.createStereoPanner(),
    r.merger = this.ctx.createChannelMerger(2);
    r.delayL = this.ctx.createDelay(maxDelayTime);
    r.delayR = this.ctx.createDelay(maxDelayTime);
    r.lp = this.ctx.createBiquadFilter();

    r.preAmp.connect(r.dryAmp);
    r.preAmp.connect(r.panL);
    r.preAmp.connect(r.panR);
    r.panL.connect(r.delayL);
    r.panR.connect(r.delayR);
    r.delayL.connect(r.merger, 0, 0);
    r.delayR.connect(r.merger, 0, 1);
    r.merger.connect(r.lp);
    r.lp.connect(r.wetAmp);
    r.dryAmp.connect(r.mixAmp);
    r.wetAmp.connect(r.mixAmp);
    r.mixAmp.connect(this.convolver.route.preAmp);

    r.panL.pan.value = -1;
    r.panR.pan.value = 1;
    r.lp.type = "lowpass";
    r.lp.Q.value = 0.7;
    this.delay.route = r;
  }
  onDelayChange(){
    let r = this.delay.route,
        s = this.delay.delayRef;

    r.dryAmp.gain.value = 1 - s.mix.value;
    r.wetAmp.gain.value = s.mix.value;
    r.lp.frequency.value = s.damp.value;
    r.delayL.delayTime.value = s.left.value;
    r.delayR.delayTime.value = s.right.value;
  }
  regConvolverRef(settings){
    this.convolver.convolverRef = settings;
    this.convolver.lastType = 'bypass';
    this.onConvolverChange();
  }
  private createConvolverRoute(){
    let r:any = {};
    r.preAmp = this.ctx.createGain();
    r.dryAmp = this.ctx.createGain();
    r.wetAmp = this.ctx.createGain();
    r.mixAmp = this.ctx.createGain();
    r.convolver = this.ctx.createConvolver();
    r.lp = this.ctx.createBiquadFilter();
    
    r.preAmp.connect(r.dryAmp);
    r.preAmp.connect(r.convolver);
    r.convolver.connect(r.lp);
    r.lp.connect(r.wetAmp);
    r.dryAmp.connect(r.mixAmp);
    r.wetAmp.connect(r.mixAmp);
    r.mixAmp.connect(this.master.route.pan);

    this.convolver.route = r;
  }
  onConvolverChange(){
    let r = this.convolver.route,
        s = this.convolver.convolverRef,
        curType = s.type;

    if(curType != this.convolver.lastType){
      this.convolver.lastType = curType;
      if(curType == 'bypass'){
        r.preAmp.disconnect();
        r.preAmp.connect(r.mixAmp);
      }
      else{
        r.preAmp.disconnect();
        r.preAmp.connect(r.dryAmp);
        r.preAmp.connect(r.convolver);
        r.convolver.buffer = s.buffer;
      }
    }
    r.dryAmp.gain.value = 1 - s.mix.value;
    r.wetAmp.gain.value = s.mix.value;
    r.lp.frequency.value = s.damp.value;
    
  }
  private createMasterRoute(){
    let r:any = {};
    r.pan = this.ctx.createStereoPanner();
    r.master = this.ctx.createGain();
    r.splitter = this.ctx.createChannelSplitter(2);
    
    r.pan.connect(r.master);
    r.master.connect(this.ctx.destination);
    r.master.connect(r.splitter);
    r.master.gain.value = 0.5;

    this.master.route = r;
  }
  private masterADSRCk(osc, tone){
    let param = osc.master.gain,
        val = this.masterADSR;

    this.setAudioParamAutomation(param, tone, val);
  }
  onPolyphonyChange(num){
    this.polyphony = num;
  }
  onMasterPanDrag(val){
    this.master.route.pan.pan.value = val;
  }
  onMasterDrag(val){
    this.master.route.master.gain.value = val;
  }
  regMasterVolMeter(meter){
    let r = this.master.route;
    r.analysers = this.createVolAnalyser(meter);
    for(let a in r.analysers){
      r.splitter.connect(r.analysers[a], +a);
    }
  }
}