import { MappingType } from '../core/value-mapping.service';
import { KnobColors } from '../controls/knob';

export class AnalyserNodes {
  sampleRate = null;
  filter = {
    filter: null,
    g1: null,
    g2: null,
    qKnob: null,
    gainKnob: null,
    freqKnob: null,
    mixKnob: null
  };
  
  // fftSize: between 32 ~ 32768 default 2048.
  analyser = {
    bass : {
      analyser: null,
      fftSize: 8192,
      buf: null
    },
    mid : {
      analyser: null,
      fftSize: 4096,
      buf: null
    },
    trem : {
      analyser: null,
      fftSize: 2048,
      buf: null
    },
    BTMDelay : null,
    MTTDelay : null
  }

  init(ctx){

    this.sampleRate = ctx.sampleRate;

    // create analyser
    let bassA = this.initAnalyser(ctx, this.analyser.bass),
        midA = this.initAnalyser(ctx, this.analyser.mid),
        tremA = this.initAnalyser(ctx, this.analyser.trem);

    // create delay
    let btm = ctx.createDelay(),
        mtt = ctx.createDelay(),
        btmOffset = (1/this.getAnalyserStep('bass')-1/this.getAnalyserStep('mid')) / 2,
        mttOffset = (1/this.getAnalyserStep('mid')-1/this.getAnalyserStep('trem')) / 2;

    btm.delayTime.value = btmOffset;
    mtt.delayTime.value = mttOffset;
    this.analyser.BTMDelay = btm;
    this.analyser.MTTDelay = mtt;

    // connect
    bassA.connect(btm);
    btm.connect(midA);
    midA.connect(mtt);
    mtt.connect(tremA);
    tremA.connect(ctx.destination);

    // create filters
    this.filter.filter = ctx.createBiquadFilter();
    this.filter.g1 = ctx.createGain();
    this.filter.g2 = ctx.createGain();

    this.filter.g1.connect(this.filter.filter);
    this.filter.filter.connect(bassA);
    this.filter.g2.connect(bassA);

    this.filter.filter.type = 'lowpass';
    this.filter.g1.gain.value = 0;
    this.filter.g2.gain.value = 1;

    // filter knobs
    this.initFilterKnobs();
  }

  getFilterKnobs(){
    return {
      q: this.filter.qKnob,
      gain: this.filter.gainKnob,
      mix: this.filter.mixKnob,
      freq: this.filter.freqKnob
    }
  }

  onFilterTypeChange(type){
    this.filter.filter.type = type;
  }

  onFilterChange(){
    this.filter.filter.frequency.value = this.filter.freqKnob.value;
    this.filter.filter.Q.value = this.filter.qKnob.value;
    this.filter.filter.gain.value = this.filter.gainKnob.value;
    this.filter.g1.gain.value = this.filter.mixKnob.value;
    this.filter.g2.gain.value = 1-this.filter.mixKnob.value;
  }

  uninit(){
    this.analyser.bass.analyser.disconnect();
    this.analyser.mid.analyser.disconnect();
    this.analyser.trem.analyser.disconnect();
    this.analyser.BTMDelay.disconnect();
    this.analyser.MTTDelay.disconnect();
    this.filter.filter.disconnect();
  }

  connectSrc(src){
    src.connect(this.filter.g1);
    src.connect(this.filter.g2);
  }

  onSmoothingChange(val){
    this.analyser.bass.analyser.smoothingTimeConstant = val;
    this.analyser.mid.analyser.smoothingTimeConstant = val;
    this.analyser.trem.analyser.smoothingTimeConstant = val;
  }

  getFreqData(type){
    let a = this.analyser[type].analyser,
        buf = this.analyser[type].buf;

    a.getByteFrequencyData(buf);
    return buf;
  }

  getAnalyserStep(type){ // in Hz
    let a = this.analyser[type].analyser;
    return this.sampleRate / a.fftSize;
  }

  private initAnalyser(ctx, o){
    o.analyser = ctx.createAnalyser();
    o.analyser.smoothingTimeConstant = 0.5;
    o.analyser.fftSize = o.fftSize;
    o.analyser.minDecibels = -90;
    o.analyser.maxDecibels = 0;
    o.buf = new Uint8Array(o.fftSize/2);
    return o.analyser;
  }

  private initFilterKnobs(){
    this.filter.freqKnob = {
      id: 'filter-freq',
      range: [20, 16000],
      size: 60,
      value: 200,
      color: KnobColors.green,
      unit: 'hz',
      mapping: MappingType.Exp10,
      mods: []
    };
    this.filter.gainKnob = {
      id: 'filter-gain',
      range: [-40, 40],
      size: 60,
      value: 0,
      unit: 'dB',
      color: KnobColors.purple,
      mapping: MappingType.Linear,
      mods: []
    };
    this.filter.qKnob = {
      id: 'filter-q',
      range: [0.001, 30],
      size: 60,
      value: 1,
      unit: '',
      color: KnobColors.blue,
      mapping: MappingType.Exp10,
      mods: []
    };
    this.filter.mixKnob = {
      id: 'filter-mix',
      range: [0, 1],
      size: 60,
      value: 0,
      unit: '',
      color: KnobColors.black,
      mapping: MappingType.Linear,
      mods: []
    }
  }
}