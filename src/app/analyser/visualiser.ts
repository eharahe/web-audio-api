import { getLogCoefficients, getLogVal } from './frequency-mapping';
import { Matrix4x4 } from './Matrix4x4';
import { CameraController } from './cameraController';
import { o3djs } from "./o3d";

enum ANALYSISTYPE{
  FREQUENCY = 0,
  SONOGRAM = 1
}

export class Visualizer{
  
  bassBuffRef = null;
  midBuffRef = null;
  tremBuffRef = null;

  constructor(b, m, t){
    this.bassBuffRef = b;
    this.midBuffRef = m;
    this.tremBuffRef = t;
  }

  private freqCtx2d = null;
  private freqW = 0;
  private freqH = 0;
  private sonoCtx2d = null;
  private sonoW = 0;
  private sonoH = 0;

  init2d(freq, sono){
    this.freqCtx2d = freq.getContext("2d");
    this.sonoCtx2d = sono.getContext("2d");
    this.freqW = freq.width;
    this.freqH = freq.height;
    this.sonoW = sono.width;
    this.sonoH = sono.height;
  }

  /**
   * @param {boolean} is3d - Is this rendered with 'webgl' or '2d' context
   * @param {number} sr - Sample-rate of audio context
   * @param {Uint8Array} bassArr - Bass freq analyser freq data
   * @param {Uint8Array} midArr - Middle freq analyser freq data
   * @param {Uint8Array} tremArr - Trem freq analyser freq data
   */
  drawFreqency(is3d, sr, bassArr, midArr, tremArr){

    let split1 = this.getSplit(sr, bassArr, 180),
        split2 = this.getSplit(sr, midArr, 4000);

    if(is3d){
      this.freq3dVl.drawGL();
    }
    else{
      // freq-logarithmic = a + b*log2(freq)
      let coef = getLogCoefficients(40, 22000, this.freqW);
      let bassReducedArr = this.reduce(bassArr, sr, coef, 20,     split1, 2),
          midReducedArr  = this.reduce(midArr,  sr, coef, split1, split2, 2),
          tremReducedArr = this.reduce(tremArr, sr, coef, split2, 22000,  2),
          renderArray = bassReducedArr.concat(midReducedArr, tremReducedArr);

      this.freq2d(renderArray, coef);
    }
  }

  /**
   * @param {boolean} is3d - Is this rendered with 'webgl' or '2d' context
   * @param {HTMLCanvasElement} canvas
   * @param {number} canvasH - Canvas height
   * @param {number} canvasW - Canvas width
   * @param {number} sr - Sample-rate of audio context
   * @param {Uint8Array} bassArr - Bass freq analyser freq data
   * @param {Uint8Array} midArr - Middle freq analyser freq data
   * @param {Uint8Array} tremArr - Trem freq analyser freq data
   */
  drawSonogram(is3d, sr, bassArr, midArr, tremArr){
    let split1 = this.getSplit(sr, bassArr, 180),
        split2 = this.getSplit(sr, midArr, 4000);

    if(is3d){
      this.sono3dVl.drawGL();
    }
    else{
      // freq-logarithmic = a + b*log2(freq)
      let coef = getLogCoefficients(40, 22000, this.sonoH);
      let bassReducedArr = this.reduce(bassArr, sr, coef, 20,     split1, 2),
          midReducedArr  = this.reduce(midArr,  sr, coef, split1, split2, 2),
          tremReducedArr = this.reduce(tremArr, sr, coef, split2, 22000,  2),
          renderArray = bassReducedArr.concat(midReducedArr, tremReducedArr);

      this.sonogram2d(renderArray);
    }
  }

  private getSplit(sr, arr, pnt){
    let step = sr/arr.length/2,
        times = Math.floor(pnt/step);
    return step * times;
  }
  /**
   * Reduce points to draw where dx < 1/blend (px) on canvas
   */
  private reduce(array, sr, coef, low, high, blend){

    let arr = [],
        i = 1,
        lastX = -1,
        lowX  = getLogVal( low, coef.a, coef.b ),
        highX = getLogVal( high, coef.a, coef.b ),
        step  = sr/array.length/2;

    while(i < array.length){
      let x = getLogVal( i*step, coef.a, coef.b ),
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
        arr.push({x:x, y:sum/r});
        i+=r;
      }
      else{
        arr.push({x:x, y:array[i]});
        i++;
      }
      lastX = x;
    }
    return arr;
  }

  private freq2d(renderArray, coef){

    let ctx = this.freqCtx2d;
    if(!ctx) return;

    let canvasW = this.freqW,
        canvasH = this.freqH;

    let getY = (y) => {
      return ( (1-y) * 0.85 + 0.075 ) * canvasH;
    }
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.lineWidth = .5;
    ctx.strokeStyle = '#2d3341';
    ctx.fillStyle = '#a9b8de';
    ctx.beginPath();

    for(let i = 0; i < renderArray.length; i++) {

      let x = renderArray[i].x,
          y = getY( renderArray[i].y/256 );

      if(i == 0) {
        ctx.moveTo(x, getY(0));
      }
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvasW, getY(0));
    ctx.lineTo(0, getY(0));
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    let fontsize = canvasH / 30;
    ctx.font= fontsize+"px Consolas";

    //axis
    let freqArr = ['60','100','180','300','500','1k','2k','4k','8k','12k','20k'];
    for(let i=0; i<freqArr.length; i++){
      let x = Math.round( getLogVal(+freqArr[i].replace('k','000'), coef.a, coef.b) );
      ctx.strokeStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(x, getY(0));
      ctx.lineTo(x, getY(1));
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText(freqArr[i]+" Hz", x-20, canvasH*0.96 + fontsize/2);
    }

    let volArr = ['  0', -10, -20, -30, -40, -50, -60, -70, -80];
    for(let i=0; i<volArr.length; i++){
      let y = Math.round(getY(1 - (-volArr[i])/90));
      ctx.strokeStyle = '#fff';
      if(i==0){
        ctx.strokeStyle = '#000';
      }
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText(volArr[i]+" dB", 10, y+fontsize+2);
    }
  }

  private sonogram2d(renderArray){

    let ctx = this.sonoCtx2d;
    if(!ctx) return;

    let canvasW = this.sonoW,
        canvasH = this.sonoH;

    //shift
    let imgData = ctx.getImageData(2, 0, canvasW, canvasH);
    ctx.putImageData(imgData, 0, 0);
    ctx.lineWidth = 1;

    //draw current snap
    let x0 = canvasW-1,
        getY = (y) => {
          return canvasH - y;
        };
   
    for( let i = 0; i < renderArray.length; i++ ) {

      let l = Math.round(renderArray[i].y/256 * 100);
      ctx.beginPath();
      if(i == 0) {
        ctx.moveTo(x0, getY(0));
      }
      else{
        ctx.moveTo(x0, getY(renderArray[i-1].x));
      }        
      // ctx.strokeStyle = 'hsl(212, 40%, '+l+'%)';
      ctx.strokeStyle = 'rgba(255, 255, 255, '+l/100+')';
      ctx.lineTo(x0, getY(renderArray[i].x));
      ctx.closePath();
      ctx.stroke();
    }
  }

  //webgl
  private freq3dVl = null;
  private sono3dVl = null;

  initGL(freqCan, sonoCan, fwidth){
    this.freq3dVl = new GLVisualizer(
      freqCan, 
      ANALYSISTYPE.FREQUENCY,
      this.bassBuffRef, 
      this.midBuffRef, 
      this.tremBuffRef, fwidth
    );
    this.sono3dVl = new GLVisualizer(
      sonoCan, 
      ANALYSISTYPE.SONOGRAM,
      this.bassBuffRef, 
      this.midBuffRef, 
      this.tremBuffRef, fwidth
    );
  }
}

class GLVisualizer{

  private bassBuffRef = null;
  private midBuffRef = null;
  private tremBuffRef = null;

  private textureB = null;
  private textureM = null;
  private textureT = null;
  private TEXTURE_HEIGHT = 512;
  private yoffset = 0;
  private fwidth = null;

  private canvas = null;
  private gl = null;

  private coef = null;

  private analysisType = null;
  private vboTexCoordOffset = null;
  private vbo = null;

  private frequencyShader = 0;
  private sonogramShader = 0;

  private backgroundColor = [0.110, 0.121, 0.149, 1.0];
  private foregroundColor = [0.0 / 255.0,
                           175.0 / 255.0,
                           255.0 / 255.0,
                           1.0];

  constructor(canvas, type:ANALYSISTYPE, bassBuffRef, midBuffRef, tremBuffRef, fwidth){

    this.canvas = canvas;
    this.analysisType = type;
    this.bassBuffRef = bassBuffRef;
    this.midBuffRef = midBuffRef;
    this.tremBuffRef = tremBuffRef;
    this.fwidth = fwidth;

    this.gl = this.getGLContext(canvas);
    if(!this.gl){
      throw 'WebGL not supported!';
    }
    let gl = this.gl;

    // this.coef = getLogCoefficients(40, this.fwidth, 2);
    this.coef = getLogCoefficients(40, 22000, 2);

    let bgc = this.backgroundColor;
    gl.clearColor(bgc[0], bgc[1], bgc[2], bgc[3]);
    gl.enable(gl.DEPTH_TEST);

    // Initialization for the 2D visualizations
    let vertices = new Float32Array([
        1.0,  1.0, 0.0,
        -1.0,  1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0,  1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0]);
    let texCoords = new Float32Array([
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        0.0, 0.0,
        1.0, 0.0]);

    let vboTexCoordOffset = vertices.byteLength;
    this.vboTexCoordOffset = vboTexCoordOffset;

    // Create the vertices and texture coordinates
    let vbo = gl.createBuffer();
    this.vbo = vbo;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER,
      vboTexCoordOffset + texCoords.byteLength,
      gl.STATIC_DRAW);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
      gl.bufferSubData(gl.ARRAY_BUFFER, vboTexCoordOffset, texCoords);

    this.textureB = gl.createTexture();
    this.textureM = gl.createTexture();
    this.textureT = gl.createTexture();
    
    this.initTexture(gl, this.textureB, bassBuffRef, 0);
    this.initTexture(gl, this.textureM, midBuffRef, 1);
    this.initTexture(gl, this.textureT, tremBuffRef, 2);
    
    // Load the shaders
    o3djs.shader.asyncLoadFromURL( gl, 
      "assets/shaders/frequency-vertex.shader",
      "assets/shaders/frequency-fragment.shader",
      function( shader ) {this.frequencyShader = shader; }.bind(this)
    );
    o3djs.shader.asyncLoadFromURL(gl,
      "assets/shaders/sonogram-vertex.shader",
      "assets/shaders/sonogram-fragment.shader",
      function( shader ) {this.sonogramShader = shader; }.bind(this)
    );
  }

  private initTexture(gl, texture, arr, index){
    gl.activeTexture(gl['TEXTURE'+index]);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/texImage2D
    let tmp = new Uint8Array(arr.length * this.TEXTURE_HEIGHT);
    gl.texImage2D(
      gl.TEXTURE_2D,        //target
      0,                    //mipmap reduction level
      gl.ALPHA,             //internalformat
      arr.length,           //width
      this.TEXTURE_HEIGHT,  //height
      0,                    //border
      gl.ALPHA,             //format
      gl.UNSIGNED_BYTE,     //type
      tmp);                 //pixels
  }

  private refTexture(gl, texture, arr, index){
    gl.activeTexture(gl['TEXTURE'+index]);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    // see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
    gl.texSubImage2D(
      gl.TEXTURE_2D,       //target
      0,                   //mipmap reduction level
      0,                   //xoffset
      this.yoffset,        //yoffset
      arr.length,          //width
      1,                   //height
      gl.ALPHA,            //format
      gl.UNSIGNED_BYTE,    //type
      arr                  //Uint8Array
    );
  }

  private getGLContext(canvas){
    let gl = canvas.getContext('webgl2');
    if(!gl) {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    }
    return gl;
  }

  drawGL() {
    let gl = this.gl;
    let vbo = this.vbo;
    let vboTexCoordOffset = this.vboTexCoordOffset;

    let freqByteData:any = this.bassBuffRef;
    let TEXTURE_HEIGHT = this.TEXTURE_HEIGHT;
    
    let frequencyShader:any = this.frequencyShader;
    if (!frequencyShader) return;
    let sonogramShader:any = this.sonogramShader;
    if (!sonogramShader) return;
        
    if (this.analysisType != ANALYSISTYPE.SONOGRAM) {
        this.yoffset = 0;
    }

    this.refTexture(gl, this.textureB, this.bassBuffRef, 0);
    this.refTexture(gl, this.textureM, this.midBuffRef, 1);
    this.refTexture(gl, this.textureT, this.tremBuffRef, 2);

    if (this.analysisType == ANALYSISTYPE.SONOGRAM) {
        this.yoffset = (this.yoffset + 1) % TEXTURE_HEIGHT;
    }

    let currentShader;
    switch (this.analysisType) {
      case ANALYSISTYPE.FREQUENCY:
        currentShader = frequencyShader;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        currentShader.bind();
        gl.uniform1f(currentShader.yoffsetLoc, 0.5 / (TEXTURE_HEIGHT - 1));
        break;

      case ANALYSISTYPE.SONOGRAM:
        currentShader = sonogramShader;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        currentShader.bind();
        gl.uniform1f(currentShader.yoffsetLoc, this.yoffset / (TEXTURE_HEIGHT - 1));
        break;
    }

    // texture
    let bassTextureLoc = currentShader.bassTextureLoc;
    let midTextureLoc = currentShader.midTextureLoc;
    let tremTextureLoc = currentShader.tremTextureLoc;
    if (bassTextureLoc) {
        gl.uniform1i(bassTextureLoc, 0);
    }
    if (midTextureLoc) {
        gl.uniform1i(midTextureLoc, 1);
    }
    if (tremTextureLoc) {
        gl.uniform1i(tremTextureLoc, 2);
    }

    // color
    let foregroundColorLoc = currentShader.foregroundColorLoc;
    let backgroundColorLoc = currentShader.backgroundColorLoc;
    if (foregroundColorLoc) {
        gl.uniform4fv(foregroundColorLoc, this.foregroundColor);
    }
    if (backgroundColorLoc) {
        gl.uniform4fv(backgroundColorLoc, this.backgroundColor);
    }

    // coef
    let coefALoc = currentShader.coefALoc;
    let coefBLoc = currentShader.coefBLoc;
    let freqWLoc = currentShader.freqWLoc;
    if (coefALoc) {
        gl.uniform1f(coefALoc, this.coef.a);
    }
    if (coefBLoc) {
        gl.uniform1f(coefBLoc, this.coef.b);
    }
    if (freqWLoc) {
        gl.uniform1f(freqWLoc, this.fwidth);
    }

    // Set up the vertex attribute arrays
    let vertexLoc = currentShader.gPositionLoc;
    let texCoordLoc = currentShader.gTexCoord0Loc;
    let texCoordOffset = vboTexCoordOffset;
    gl.enableVertexAttribArray(vertexLoc);
    gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, gl.FALSE, 0, texCoordOffset);

    // Clear the render area
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Actually draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Disable the attribute arrays for cleanliness
    gl.disableVertexAttribArray(vertexLoc);
    gl.disableVertexAttribArray(texCoordLoc);
  }
}