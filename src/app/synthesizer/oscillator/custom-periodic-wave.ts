/**
 *         2
 * b[n] = —— [1- (-1)^n]
 *        nπ
 */
function getSquCoef(n){
  let real = [],
      imag = [];
  for(let i=0; i<n; i++){
    real.push(0);
    if(i%2==0){
      imag.push(0);
    }
    else{
      imag.push(4/i/Math.PI);
    }
  }
  return {real:real, imag: imag};
}
/**
 *         2
 * b[n] = —— (-1)^(n+1)
 *        nπ
 */
function getSawCoef(n){
  let real = [],
      imag = [];
  for(let i=0; i<n; i++){
    real.push(0);
    if(i==0){
      imag.push(0);
    }
    else{
      imag.push(Math.pow(-1,i+1)*2/i/Math.PI);
    }
  }
  return {real:real, imag: imag};
}
/**
 *         8 sin(nπ÷2)
 * b[n] = ————————————
 *          (nπ)^2
 */
function getTriCoef(n){
  let real = [],
      imag = [];
  for(let i=0; i<n; i++){
    real.push(0);
    if(i==0){
      imag.push(0);
    }
    else{
      imag.push(8*Math.sin(Math.PI*i/2) / Math.pow(Math.PI*i, 2));
    }
  }
  return {real:real, imag: imag};
}
export const PeriodicWaves = [
  { 
    name:'User-Squ1',
    str:'Sin-Squ-1',
    wave:getSquCoef(4)
  },
  { 
    name:'User-Squ2',
    str:'Sin-Squ-2',
    wave:getSquCoef(6)
  },
  { 
    name:'User-Squ3',
    str:'Sin-Squ-3',
    wave:getSquCoef(10)
  },
  { 
    name:'User-Squ4',
    str:'Sin-Squ-4',
    wave:getSquCoef(20)
  },

  { 
    name:'User-Saw1',
    str:'Sin-Saw-1',
    wave:getSawCoef(4)
  },
  { 
    name:'User-Saw2',
    str:'Sin-Saw-2',
    wave:getSawCoef(6)
  },
  { 
    name:'User-Saw3',
    str:'Sin-Saw-3',
    wave:getSawCoef(10)
  },
  { 
    name:'User-Saw4',
    str:'Sin-Saw-4',
    wave:getSawCoef(20)
  },

  { 
    name:'User-Tri1',
    str:'Sin-Tri-1',
    wave:getTriCoef(4)
  },
  { 
    name:'User-Tri2',
    str:'Sin-Tri-2',
    wave:getTriCoef(6)
  },
  { 
    name:'User-Tri3',
    str:'Sin-Tri-3',
    wave:getTriCoef(10)
  },
  { 
    name:'User-Tri4',
    str:'Sin-Tri-4',
    wave:getTriCoef(20)
  }
]