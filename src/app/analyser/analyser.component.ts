import { Component, OnInit, OnDestroy }         from '@angular/core';
import { SuperService }                         from '../core/super.service';
import { MappingType } from '../core/value-mapping.service';
import { KnobColors } from '../controls/knob';

enum PlaybackState{
  Stoped,
  Playing,
  Paused
}
@Component({
  selector: 'analyser-container',
  templateUrl: './analyser.component.html',
  styleUrls: ['./analyser.component.css']
})
export class AnalyserComponent implements OnInit, OnDestroy{
  showNodeInheritance = false;
  private audioCtx = null;
  private audioData = null;
  private bufferSrc = null;
  private mediaStreamSrc = null;
  private BTMDelay = null;
  private MTTDelay = null;
  urlStr = "";
  latestXHR = null;
  filter = {
    filter: null,
    g1: null,
    g2: null,
    q: null,
    gain: null,
    freq: null,
    mix: null,
    type: 'lowpass',
  };
  filterTypes = [
    {id:'lowpass', name:'Lowpass'},
    {id:'highpass', name:'Highpass'},
    {id:'bandpass', name:'Bandpass'},
    {id:'lowshelf', name:'Lowshelf'},
    {id:'highshelf', name:'Highshelf'},
    {id:'peaking', name:'Peaking'},
    {id:'notch', name:'Notch'},
  ]
  private bass = {
    analyser: null,
    step: 10,
    fftSize: 16384/2,
    fftLen: 0
  }
  private mid = {
    analyser: null,
    step: 20,
    fftSize: 4096,
    fftLen: 0
  }
  private trem = {
    analyser: null,
    step: 20,
    fftSize: 2048,
    fftLen: 0
  }
  pixelRatio = 1;

  playback = {
    timmer : null,
    playAble : false,
    isPlaying : false,
    isStopped : true,
    percent : 0,
    offset : 0,
    lastTs : 0
  }
  wave = {
    analyzing: false,
    waveformInfo: '',
    waveformTs: '',
    width: 1000,
    height: 150
  }
  freq = {
    width : 1000,
    height : 200,
    startFreq: 20,
    endFreq: 22000,
    coef: null,
    frequencyTs : ''
  };
  spec = {
    width : 490,
    height : 350,
    startFreq: 40,
    endFreq: 16000,
    coef: null
  };

  constructor(sp: SuperService){
    this.audioCtx = sp.getAudioContext();
  }
  ngOnInit(){
    this.pixelRatio = window.devicePixelRatio;
    this.initAnalyser(this.bass);
    this.initAnalyser(this.mid);
    this.initAnalyser(this.trem);

    let bassToMid = this.bass.fftLen - this.mid.fftLen,
        midToTrem = this.mid.fftLen - this.trem.fftLen;
    
    this.BTMDelay = this.audioCtx.createDelay(bassToMid/2);
    this.MTTDelay = this.audioCtx.createDelay(midToTrem/2);
    this.BTMDelay.delayTime.value = bassToMid/2;
    this.MTTDelay.delayTime.value = midToTrem/2;

    this.bass.analyser.connect(this.BTMDelay);
    this.BTMDelay.connect(this.mid.analyser);
    this.mid.analyser.connect(this.MTTDelay);
    this.MTTDelay.connect(this.trem.analyser);
    this.trem.analyser.connect(this.audioCtx.destination);

    this.filter.filter = this.audioCtx.createBiquadFilter();
    this.filter.g1 = this.audioCtx.createGain();
    this.filter.g2 = this.audioCtx.createGain();
    this.filter.g1.connect(this.filter.filter);
    this.filter.filter.connect(this.bass.analyser);
    this.filter.g2.connect(this.bass.analyser);
    this.filter.filter.type = this.filter.type;
    this.filter.g1.gain.value = 0;
    this.filter.g2.gain.value = 1;
    this.filter.freq = {
      id: 'filter-freq',
      range: [20, 16000],
      size: 60,
      value: 200,
      color: KnobColors.green,
      unit: 'hz',
      mapping: MappingType.Exp10,
      mods: []
    };
    this.filter.gain = {
      id: 'filter-gain',
      range: [-40, 40],
      size: 60,
      value: 0,
      unit: 'dB',
      color: KnobColors.purple,
      mapping: MappingType.Linear,
      mods: []
    };
    this.filter.q = {
      id: 'filter-q',
      range: [0.001, 30],
      size: 60,
      value: 1,
      unit: '',
      color: KnobColors.blue,
      mapping: MappingType.Exp10,
      mods: []
    };
    this.filter.mix = {
      id: 'filter-mix',
      range: [0, 1],
      size: 60,
      value: 0,
      unit: '',
      color: KnobColors.black,
      mapping: MappingType.Linear,
      mods: []
    }

    this.spec.startFreq = this.freq.startFreq = Math.max(40, this.bass.step);
    this.freq.endFreq = Math.min(22000, this.audioCtx.sampleRate / 2); 
    this.freq.coef = this.getLogCoefficients(this.freq.width);
    this.spec.coef = this.getLogCoefficients(this.spec.height*this.pixelRatio);
    
    // this.usermediaInit();
    // this.startTimmer();
  }
  downloadClick(){
    if(this.urlStr)
      this.getRemote(this.urlStr);
  }
  demoClick(){
    let urls = [
      'assets/music/hysteria.mp3',
      'assets/music/ywq.mp3',
      'assets/music/youarethehero.mp3'
    ];
    this.getRemote(urls[Math.floor(Math.random()*2.99)]);
  }
  usermediaInit(){
    if (navigator.getUserMedia) {
       console.log('getUserMedia supported.');
       navigator.getUserMedia (
          {audio: true},
          (stream) => {
             this.mediaStreamSrc = this.audioCtx.createMediaStreamSource(stream);
             this.mediaStreamSrc.connect(this.filter.g1);
             this.mediaStreamSrc.connect(this.filter.g2);
          },
          (err) => {
             console.log('The following gUM error occured: ' + err);
          }
       );
    } else {
       console.log('getUserMedia not supported on your browser!');
    }
  }
  ngOnDestroy(){
    // this.endTimmer();
    this.onMusicStop();
    this.bass.analyser.disconnect();
    this.mid.analyser.disconnect();
    this.trem.analyser.disconnect();
    this.BTMDelay.disconnect();
    this.MTTDelay.disconnect();
    this.filter.filter.disconnect();
    // this.mediaStreamSrc.disconnect();
  }
  private initAnalyser(o){
    o.analyser = this.audioCtx.createAnalyser();
    o.analyser.smoothingTimeConstant = 0.8;
    o.analyser.fftSize = o.fftSize;
    o.analyser.minDecibels = -90;
    o.analyser.maxDecibels = 0;
    o.step = this.audioCtx.sampleRate / 2 / o.analyser.frequencyBinCount;
    o.fftLen = o.fftSize / this.audioCtx.sampleRate;
  }
  showSvgClick = function(){
    this.showNodeInheritance = !this.showNodeInheritance;
  }
  musicChange = function(e){
    let file = e.target.files[0];
    if(!file) return;

    this.onMusicStop();
    this.wave.analyzing = true;
    this.playback.playAble = false;
    this.wave.waveformInfo = 'Analyzing...';

    let fr = new FileReader();
    fr.readAsArrayBuffer(file);
    this.audioData = {
      name: file.name.substring(0, file.name.lastIndexOf('.')),
      buffer: null,
      decoding: true
    };
    fr.onload = (e:any) => {
      this.decodeBuffer(e.target.result, this.prepareWaveform);
    };
  }
  getRemote = function(url){
    this.onMusicStop();
    // let reg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
    // if(!url.match(reg)){
    //   this.wave.waveformInfo = 'File Url Illegal!';
    //   return;
    // }
    this.wave.analyzing = true;
    this.playback.playAble = false;
    this.wave.waveformInfo = 'Downloading '+url+'...';

    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    this.audioData = {
      name: url,
      buffer: null,
      decoding: true
    };
    
    xhr.onload = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.wave.waveformInfo = 'Analyzing...';
          let rsp = xhr.response;
          this.decodeBuffer(rsp, this.prepareWaveform);
        } else {
          console.error('[Analyser] '+xhr.status+' '+xhr.statusText);
          this.wave.waveformInfo = '[Analyser] '+xhr.status+' '+xhr.statusText;
          this.wave.analyzing = false;
          this.ghostRef();
        }
      }
      else{
        console.error('[Analyser] '+xhr.statusText);
        this.wave.waveformInfo = '[Analyser] '+xhr.statusText;
        this.wave.analyzing = false;
        this.ghostRef();
      }      
    }

    xhr.onerror = (e) =>{
      console.error('[Analyser] XHR error');
      this.wave.waveformInfo = '[Analyser] XHR error';
      this.wave.analyzing = false;
      this.ghostRef();
    };
    xhr.send();
    this.latestXHR = xhr;
  }

  private decodeBuffer(buffer, cb) {
    this.audioCtx.decodeAudioData(buffer, (buffer) => {
      cb.call(this, buffer);
    }, (e) => {
      console.error('[Analyser] Decode Failed!');
      this.wave.waveformInfo = '[Analyser] Decode Failed!';
      this.wave.analyzing = false;
      this.ghostRef();
    })
  }

  private prepareWaveform(buffer) {
    this.audioData.buffer = buffer;
    this.audioData.decoding = false;
    this.drawWaveForm(buffer);
    this.wave.analyzing = false;
    this.playback.playAble = true;
    this.wave.waveformTs = '0 / ' + this.timeFormat(buffer.duration);
    this.ghostRef();
  }

  private timeFormat(ts){
    let s:Array<string> = [],
        t = ts.toFixed(1);

    if(t>=60){
      s.unshift(':'+(ts%60).toFixed(1));
      t = Math.floor(t/60);
      if(t>=60){
        s.unshift(':'+ts%60);
        s.unshift(''+ Math.floor(t/60));
      }
      else{
        s.unshift(''+t);
      }
    }
    else{
      s.unshift(''+t);
    }
    return s.join('');
  }

  private drawWaveForm(buffer){
    let channelNum = buffer.numberOfChannels,
        bufferLen = buffer.length,
        dotNum = this.wave.width * 3,
        step = Math.max(1, Math.round(bufferLen/dotNum)),
        peak = 0;

    let canvas : any = document.querySelector('.waveform-canvas'),
        canvasCtx = canvas.getContext("2d"),
        channelHeight = this.wave.height/channelNum;

    canvasCtx.clearRect(0, 0, this.wave.width, this.wave.height);
    canvasCtx.lineWidth = .5;
    canvasCtx.strokeStyle = 'orange';

    for(let c=0; c<channelNum; c++){
      let dataArray = buffer.getChannelData(c),
          graphArray = [];

      for(let i = 0; i < bufferLen; i += step) {
        let max = 0,
            min = 0;
        for(let j = 0; j < step; j++){
          let val = dataArray[i+j];
          if(val){
            if(val>max) max = val;
            if(val<min) min = val;
            if(Math.abs(val)>peak) peak = Math.abs(val);
          }
        }
        graphArray.push({max:max, min:min});
      }

      canvasCtx.beginPath(); 
      let sliceWidth = this.wave.width * 1.0 / graphArray.length,
          x = 0;

      for(let i = 0; i < graphArray.length; i++) {

        let v = graphArray[i],
            y1 = (-v.max/peak+1) * channelHeight/2 * 0.8 + (c+0.1)*channelHeight,
            y2 = (-v.min/peak+1) * channelHeight/2 * 0.8 + (c+0.1)*channelHeight;

        if(i === 0) {
          canvasCtx.moveTo(x, y1);
        } else {
          canvasCtx.lineTo(x, y1);
          canvasCtx.lineTo(x, y2);
        }

        x += sliceWidth;
      }
      canvasCtx.lineTo(canvas.width, (c+0.5)*channelHeight);
      canvasCtx.stroke();
    }
    this.wave.waveformInfo = '[Name]: ' + this.audioData.name + ' [Peak]: '+ peak.toFixed(2);
  }
  private ghostRef(){
    let ghostBtn:any = document.querySelector('.ghost');
    ghostBtn.click();
  }
  ghostClick(){}

  onMusicPlayPause(){
    if(this.playback.isStopped){
      this.bufferSrc = this.audioCtx.createBufferSource();
      this.bufferSrc.buffer = this.audioData.buffer;
      this.bufferSrc.connect(this.filter.g1);
      this.bufferSrc.connect(this.filter.g2);
      // this.bufferSrc.connect(this.audioCtx.destination);
      this.bufferSrc.start();
      this.playback.lastTs = this.audioCtx.currentTime;
      this.changeState(PlaybackState.Playing);
      this.startTimmer();
      this.bufferSrc.onended = () => {
        this.onMusicStop();
        this.ghostRef();
      }
    }
    else if(this.playback.isPlaying){
      this.audioCtx.suspend();
      this.playback.offset += this.audioCtx.currentTime - this.playback.lastTs;
      this.changeState(PlaybackState.Paused);
    }
    else{
      this.audioCtx.resume();
      this.playback.lastTs = this.audioCtx.currentTime;
      this.changeState(PlaybackState.Playing);
    }
  }
  onMusicStop(){
    if(this.bufferSrc){
      this.bufferSrc.stop();
      this.bufferSrc.disconnect();
      this.bufferSrc = null; 
    }
    if(this.latestXHR){
      this.latestXHR.abort();
    }
    this.endTimmer();
    this.audioCtx.resume();
    this.playback.offset = 0;
    this.playback.percent = 0;
    this.changeState(PlaybackState.Stoped);
  }
  private changeState(s:PlaybackState){
    switch(s){
      case PlaybackState.Stoped:
        this.playback.isStopped = true;
        this.playback.isPlaying = false;
        break;
      case PlaybackState.Playing:
        this.playback.isStopped = false;
        this.playback.isPlaying = true;
        break;
      case PlaybackState.Paused:
        this.playback.isStopped = false;
        this.playback.isPlaying = false;
        break;
    }
  }
  private startTimmer(){
    let loop = ()=>{
      //waveform
      this.checkPlaybackPos();

      //spectrum
      let bassArrLen = this.bass.analyser.frequencyBinCount,
          bassArray = new Uint8Array(bassArrLen),
          midArrLen = this.mid.analyser.frequencyBinCount,
          midArray = new Uint8Array(midArrLen),
          tremArrLen = this.trem.analyser.frequencyBinCount,
          tremArray = new Uint8Array(tremArrLen),
          t0 = new Date().getTime();

      this.bass.analyser.getByteFrequencyData(bassArray);
      this.mid.analyser.getByteFrequencyData(midArray);
      this.trem.analyser.getByteFrequencyData(tremArray);
      this.drawFreq(bassArray,midArray,tremArray);
      this.drawSpec(bassArray,midArray,tremArray);
      this.playback.timmer = requestAnimationFrame(loop);
      this.freq.frequencyTs = 'Render cost: ' + (new Date().getTime() - t0) + 'ms';
    }
    loop();
  }
  private endTimmer(){
    cancelAnimationFrame(this.playback.timmer);
  }
  private checkPlaybackPos(){
    let now = this.audioCtx.currentTime,
        ts = 0;

    if(this.playback.isPlaying){
      ts = now - this.playback.lastTs + this.playback.offset;
    }
    else{
      ts = this.playback.offset;
    }
    this.wave.waveformTs = this.timeFormat(ts) + ' / ' + this.timeFormat(this.audioData.buffer.duration);
    this.playback.percent = (Math.max(0, ts-this.bass.fftLen/2))/this.audioData.buffer.duration * 100;
  }

  /***************************************
     *  ╭ a + b*log2(startFreq) = 1
     *  <
     *  ╰ a + b*log2(endFreq) = freqW
    /**************************************/
  private getLogCoefficients(freqW){
    let startFreq = this.freq.startFreq,
        endFreq = this.freq.endFreq,
        b = (freqW-1) / (Math.log2(endFreq) - Math.log2(startFreq)),
        a = 1 - b * Math.log2(startFreq);
    return {a:a,b:b};
  }

  private getLogVal(val, a, b){
    return a+b*Math.log2(val);
  }

  private getRenderArray(array, step, a, b, low, high, blend){
    let renderArray = [],
        i = 0,
        lastX = 0,
        lowX = this.getLogVal(low, a, b),
        highX = this.getLogVal(high, a, b);

    while(i < array.length){
      let x = this.getLogVal(i*step, a, b),
          dx = x - lastX,
          r = Math.min(Math.round(1/dx), array.length-i),
          sum = 0;

      if(x < lowX){
        i++;
        continue;
      }
      if(x >= highX){
        break;
      }
      if(r >= blend){
        for(let j=0; j<r; j++){
          sum += array[i+j];
        }
        renderArray.push({x:x, y:sum/r});
        i+=r;
      }
      else{
        renderArray.push({x:x, y:array[i]});
        i++;
      }
      lastX = x;
    }
    return renderArray;
  }
  private drawFreq(bassArr, midArr, tremArr){

    let canvas : any = document.querySelector('.frequency-canvas'),
        canvasCtx = canvas.getContext("2d"),
        bassRenderArr = this.getRenderArray(bassArr, this.bass.step, this.freq.coef.a, this.freq.coef.b, this.freq.startFreq, 180, 2),
        midRenderArr = this.getRenderArray(midArr, this.mid.step, this.freq.coef.a, this.freq.coef.b, 180, 4000, 2),
        tremRenderArr = this.getRenderArray(tremArr, this.trem.step, this.freq.coef.a, this.freq.coef.b, 4000, this.freq.endFreq, 2),
        renderArray = bassRenderArr.concat(midRenderArr, tremRenderArr);

    let getY = (y) => {
      return ( (1-y) * 0.85 + 0.07 ) * this.freq.height;
    }

    canvasCtx.clearRect(0, 0, this.freq.width, this.freq.height);
    canvasCtx.lineWidth = .5;
    canvasCtx.strokeStyle = '#2d3341';
    canvasCtx.fillStyle = '#a9b8de';
    canvasCtx.beginPath();

    for(let i = 0; i < renderArray.length; i++) {

      let x = renderArray[i].x,
          y = getY(renderArray[i].y/256);

      if(i == 0) {
        canvasCtx.moveTo(x, getY(0));
      }
      canvasCtx.lineTo(x, y);
    }
    canvasCtx.lineTo(canvas.width, getY(0));
    canvasCtx.lineTo(0, getY(0));
    canvasCtx.closePath();
    canvasCtx.stroke();
    canvasCtx.fill();

    //axis
    let freqArr = ['60','100','160','300','500','1k','2k','4k','8k','12k','20k'];
    for(let i=0; i<freqArr.length; i++){
      let x = Math.round(this.getLogVal(+freqArr[i].replace('k','000'), this.freq.coef.a, this.freq.coef.b));
      canvasCtx.strokeStyle = 'orange';
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, getY(0));
      canvasCtx.lineTo(x, getY(1));
      canvasCtx.stroke();
      canvasCtx.fillStyle = '#fff';
      canvasCtx.fillText(freqArr[i]+" Hz", x-17, this.freq.height-5);
    }

    let volArr = ['   0', -10, -20, -30, -40, -50, -60, -70, -80];
    for(let i=0; i<volArr.length; i++){
      let y = Math.round(getY(1 - (-volArr[i])/90));
      canvasCtx.strokeStyle = '#fff';
      if(i==0){
        canvasCtx.strokeStyle = '#000';
      }
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, y);
      canvasCtx.lineTo(this.freq.width, y);
      canvasCtx.stroke();
      canvasCtx.fillStyle = '#fff';
      canvasCtx.fillText(volArr[i]+" dB", 2, y+12);
    }
  }
  private drawSpec(bassArr, midArr, tremArr){
   
    let canvas : any = document.querySelector('.spec-canvas'),
        canvasCtx = canvas.getContext("2d"),
        ratio = this.pixelRatio,
        bassRenderArr = this.getRenderArray(bassArr, this.bass.step, this.spec.coef.a, this.spec.coef.b, this.spec.startFreq, 180, 3),
        midRenderArr = this.getRenderArray(midArr, this.mid.step, this.spec.coef.a, this.spec.coef.b, 170, 4000, 3),
        tremRenderArr = this.getRenderArray(tremArr, this.trem.step, this.spec.coef.a, this.spec.coef.b, 4000, this.spec.endFreq, 3),
        renderArray = bassRenderArr.concat(midRenderArr, tremRenderArr);

    //shift
    let imgData=canvasCtx.getImageData(2,0,this.spec.width*ratio,this.spec.height*ratio);
    canvasCtx.putImageData(imgData, 0, 0);
    canvasCtx.lineWidth = 1;

    //draw current snap
    let x0 = this.spec.width*ratio-1,
        getY = (y)=>{
          return this.spec.height*ratio - y;
        };

    if(this.playback.isPlaying){
      
      for(let i=0; i<renderArray.length; i++) {
        let l = Math.round(renderArray[i].y/256 * 100);

        canvasCtx.beginPath();
        if(i == 0) {
          canvasCtx.moveTo(x0, getY(0));
        }
        else{
          canvasCtx.moveTo(x0, getY(renderArray[i-1].x));
        }        
        canvasCtx.strokeStyle = 'hsl(212, 40%, '+l+'%)';
        canvasCtx.lineTo(x0, getY(renderArray[i].x));
        canvasCtx.closePath();
        canvasCtx.stroke();

        // if(i == 0) {
        //   canvasCtx.rect(x0, getY(0), x0+1, getY(renderArray[i].x));
        // }
        // else{
        //   canvasCtx.moveTo(x0, getY(renderArray[i-1].x));
        //   canvasCtx.rect(x0, getY(renderArray[i].x-1), 1, getY(renderArray[i].x)-getY(renderArray[i-1].x));
        // }   
        // canvasCtx.fillStyle = 'hsl(212, 40%, '+l+'%)';
        // canvasCtx.fill();
      }
    }
    else{
      canvasCtx.clearRect(this.spec.width*ratio-2, 0, this.spec.width*ratio, this.spec.height*ratio);
    }
  }

  onFilterChange(){
    this.filter.filter.type = this.filter.type;
  }
  onFreqDrag(){
    this.filter.filter.frequency.value = this.filter.freq.value;
  }
  onQDrag(){
    this.filter.filter.Q.value = this.filter.q.value;
  }
  onGainDrag(){
    this.filter.filter.gain.value = this.filter.gain.value;
  }
  onMixDrag(){
    this.filter.g1.gain.value = this.filter.mix.value;
    this.filter.g2.gain.value = 1-this.filter.mix.value;
  }
}