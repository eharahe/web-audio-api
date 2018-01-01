import { Component }                        from '@angular/core';
import { OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { SuperService }                     from '../core/super.service';
import { AnalyserNodes }                    from './analyser-nodes';
import { Visualizer }                       from './visualiser';

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
export class AnalyserComponent implements OnInit, OnDestroy, AfterViewInit{
  showNodeInheritance = false;
  private audioCtx = null;
  private audioData = null;
  private bufferSrc = null;
  private mediaStreamSrc = null;
  urlStr = "";
  latestXHR = null;
  analyserNodes = null;
  vl = null;

  filter = {
    knobs: null,
    type: 'lowpass',
    filterTypes : [
      {id:'lowpass',   name:'Lowpass'  },
      {id:'highpass',  name:'Highpass' },
      {id:'bandpass',  name:'Bandpass' },
      {id:'lowshelf',  name:'Lowshelf' },
      {id:'highshelf', name:'Highshelf'},
      {id:'peaking',   name:'Peaking'  },
      {id:'notch',     name:'Notch'    }
    ]
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
    height: 200
  }
  freq = {
    width : 1000,
    height : 250,
    ts : 'Render:',
    visualizer : '2d'
  };
  sonogram = {
    width : 700,
    height : 500,
    ts : 'Render:',
    visualizer : 'webgl'
  };

  constructor(sp: SuperService){
    this.audioCtx = sp.getAudioContext();
  }
  ngOnInit(){
    // init routes
    this.analyserNodes = new AnalyserNodes();
    this.analyserNodes.init(this.audioCtx);
    this.filter.knobs = this.analyserNodes.getFilterKnobs();

    this.pixelRatio = window.devicePixelRatio;
    // this.usermediaInit();
    // this.startTimmer();
  }
  ngAfterViewInit(){
    let freqCanvas = document.querySelector('.frequency-canvas'),
        sonoCanvas = document.querySelector('.sonogram-canvas'),
        freqGL = document.querySelector('.frequency-canvas-gl'),
        sonoGL = document.querySelector('.sonogram-canvas-gl');

    let bass = this.analyserNodes.getFreqData('bass'),
        mid = this.analyserNodes.getFreqData('mid'),
        trem = this.analyserNodes.getFreqData('trem');

    this.vl = new Visualizer(bass, mid, trem);
    this.vl.initGL(freqGL, sonoGL, this.audioCtx.sampleRate/2);
    this.vl.init2d(freqCanvas, sonoCanvas);
  }
  ngOnDestroy(){
    // this.endTimmer();
    this.onMusicStop();
    this.analyserNodes.uninit();
    // this.mediaStreamSrc.disconnect();
  }
  downloadClick(){
    if(this.urlStr)
      this.getRemote(this.urlStr);
  }
  demoClick(){
    let urls = [
      'assets/music/penglai.mp3',
      'assets/impulse/hall5.wav',
      'assets/music/ywq.mp3',
      'assets/music/wow.mp3',
      'assets/music/too_kewl.mp3'
    ];
    this.getRemote(urls[Math.floor(Math.random()*(urls.length-0.01))]);
  }
  usermediaInit(){
    if (navigator.getUserMedia) {
       console.log('getUserMedia supported.');
       navigator.getUserMedia (
          {audio: true},
          (stream) => {
             this.mediaStreamSrc = this.audioCtx.createMediaStreamSource(stream);
             this.analyserNodes.connectSrc(this.mediaStreamSrc);
          },
          (err) => {
             console.log('The following gUM error occured: ' + err);
          }
       );
    } else {
       console.log('getUserMedia not supported on your browser!');
    }
  }
  smoothChange(e){
    this.analyserNodes.onSmoothingChange(+e.target.value)
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
        canvasW = canvas.width,
        canvasH = canvas.height,
        channelHeight = canvasH/channelNum;

    canvasCtx.clearRect(0, 0, canvasW, canvasH);
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
      let sliceWidth = canvasW * 1.0 / graphArray.length,
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
    this.wave.waveformInfo = '[Name]: '+ this.audioData.name +' '+
                             '[Peak]: '+ peak.toFixed(2);
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
      this.analyserNodes.connectSrc(this.bufferSrc);
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
      this.refPlaybackStatus();

      //get frequency data
      let t0 = new Date().getTime(),
          bassArr = this.analyserNodes.getFreqData('bass'),
          midArr = this.analyserNodes.getFreqData('mid'),
          tremArr = this.analyserNodes.getFreqData('trem');

      //freq
      let t1 = new Date().getTime();
      this.vl.drawFreqency(
        this.freq.visualizer == 'webgl',
        this.audioCtx.sampleRate,
        bassArr, midArr, tremArr
      );
      let t2 = new Date().getTime();
      this.freq.ts = 'Arrange buffer: '+ (t1 - t0) +'ms  '+
                     'Render: '+ (t2 - t1) +'ms';

      //sonogram
      t0 = new Date().getTime();
      if(this.playback.isPlaying){
        this.vl.drawSonogram(
          this.sonogram.visualizer == 'webgl',
          this.audioCtx.sampleRate,
          bassArr, midArr, tremArr
        );
      }
      this.playback.timmer = requestAnimationFrame(loop);
      this.sonogram.ts = 'Render cost: ' + (new Date().getTime() - t0) + 'ms';
    }

    //start loop
    loop();
  }
  private endTimmer(){
    cancelAnimationFrame(this.playback.timmer);
  }
  private refPlaybackStatus(){
    let now = this.audioCtx.currentTime,
        ts = 0;

    if(this.playback.isPlaying){
      ts = now - this.playback.lastTs + this.playback.offset;
    }
    else{
      ts = this.playback.offset;
    }
    this.wave.waveformTs = this.timeFormat(ts) + ' / '
                            + this.timeFormat(this.audioData.buffer.duration);

    let FFTFrameLen = 1 / this.analyserNodes.getAnalyserStep('bass');
    let playingTime = Math.max( 0, ts - FFTFrameLen/2 );
    this.playback.percent = playingTime / this.audioData.buffer.duration * 100;
  }

  onFilterChange(){
    this.analyserNodes.onFilterTypeChange(this.filter.type);
  }
  onFreqDrag(){
    this.analyserNodes.onFilterChange();
  }
  onQDrag(){
    this.analyserNodes.onFilterChange();
  }
  onGainDrag(){
    this.analyserNodes.onFilterChange();
  }
  onMixDrag(){
    this.analyserNodes.onFilterChange();
  }
}