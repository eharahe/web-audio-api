// Frequency fragment shader
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 texCoord;

uniform sampler2D bassTexture;
uniform sampler2D midTexture;
uniform sampler2D tremTexture;

uniform vec4 foregroundColor;
uniform vec4 backgroundColor;
uniform float yoffset;

uniform float coefA;
uniform float coefB;
uniform float freqW;

void main()
{
    float f = pow( 2.0, (texCoord.x - coefA)/coefB );
    float x = f / freqW;
    float y = yoffset;

    float k = 0.0;
    if (f<140.0) {
      vec4 sample = texture2D(bassTexture, vec2(x, y));
      k = sample.a;
    }
    else if (f<210.0) {
      float ratio = (f-140.0)/70.0;
      vec4 bass = texture2D(bassTexture, vec2(x, y));
      vec4 mid = texture2D(midTexture, vec2(x, y));
      k = mid.a*ratio + bass.a*(1.0-ratio);
    }
    else if (f<3200.0) {
      vec4 sample = texture2D(midTexture, vec2(x, y));
      k = sample.a;
    }
    else if (f<4600.0) {
      float ratio = (f-3200.0)/1400.0;
      vec4 mid = texture2D(midTexture, vec2(x, y));
      vec4 trem = texture2D(tremTexture, vec2(x, y));
      k = trem.a*ratio + mid.a*(1.0-ratio);
    }
    else{
      vec4 sample = texture2D(tremTexture, vec2(x, y));
      k = sample.a;
    }

    if (texCoord.y > k) {
        // if (texCoord.y > sample.a + 1 || texCoord.y < sample.a - 1) {
        discard;
    }
    x = texCoord.y / k;
    x = x * x * x;
    gl_FragColor = vec4(0.6627, 0.72157, 0.87059, .9);
}
