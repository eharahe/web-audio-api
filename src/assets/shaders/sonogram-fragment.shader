// Sonogram fragment shader
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 texCoord;
varying vec3 color;

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
    float y = texCoord.y + yoffset;

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

    // gl_FragColor = vec4(k, k, k, 1.0);
    // Fade out the mesh close to the edges
    float fade = pow(cos((1.0 - texCoord.y) * 0.5 * 3.1415926535), 0.5);
    k *= fade;
    gl_FragColor = backgroundColor + vec4(k * color, 1.0);
}
