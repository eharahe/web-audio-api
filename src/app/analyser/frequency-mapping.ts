/***************************************
 *  Map start-frequency to 0
 *      end-frequency to canvas-width
 *
 *  ╭ a + b*log2(startFreq) = 0
 *  <
 *  ╰ a + b*log2(endFreq) = canvasW - 1
 *
/**************************************/
export function getLogCoefficients(startFreq, endFreq, canvasW){
  let b = ( canvasW - 1 ) / ( Math.log2(endFreq) - Math.log2(startFreq) ),
      a = -b * Math.log2(startFreq);
  return {a:a, b:b};
}
export function getLogVal(val, a, b){
  return a + b*Math.log2(val);
}