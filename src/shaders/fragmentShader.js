const fragmentShader = `

uniform float uTime;
uniform vec2 uMouse;
uniform float uPointerSize;
uniform samplerCube iChannel0;
uniform float progress;
uniform sampler2D uTexture;
uniform sampler2D uNoiseTexture;
uniform vec4 uResolution;
uniform float uReflection;
uniform float uSpeed;
uniform float uIOR;
uniform int uCount;
uniform float uSize;
uniform float uDispersion;
uniform float uRefract;
uniform float uChromaticAberration;
uniform float uNoiseScale;
uniform float uNoiseAmount;

uniform vec3 uCamPos;
uniform mat4 uCamToWorldMat;
uniform mat4 uCamInverseProjMat;

varying vec2 vUv;
varying vec3 worldNormal;

const float PI = 3.14159265359;
const float HALF_PI = 0.5*PI;
const float TWO_PI = 2.0*PI;
const int LOOP = 16;

#define MAX_STEPS 100
#define MAX_DIST 5.0
#define MIN_DIST 0.005

float hash(in float v) { return fract(sin(v)*43237.5324); }
vec3 hash3(in float v) { return vec3(hash(v), hash(v*99.), hash(v*9999.)); }

float sphere(in vec3 p, in float r) { 
    float d = length(p) - r; 
    
    vec2 uv = vec2(
        0.5 + atan(p.z, p.x) / (2.0 * PI),
        0.5 + asin(p.y / length(p)) / PI
    ) * uNoiseScale;

    vec2 animatedUV = vec2(uv.y + uTime * 0.07, uv.x + uTime * 0.05);
    
    float noise = texture2D(uNoiseTexture, animatedUV).r;
    // float noise = texture2D(uNoiseTexture, uv).r;
    
    noise *= smoothstep(1.4, 1.0, abs(p.x));
    // d -= noise * uNoiseAmount;
    
    return d;
}

float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

#define BALL_NUM 10

float map(in vec3 p) {
    float res = 1e5;
    
    vec3 mousePos = vec3(uMouse.x * (uResolution.x/uResolution.y) * 2.5, uMouse.y * 2.5, 0.0);
    res = sphere(p - mousePos, uPointerSize);
    
    for(int i=0; i<BALL_NUM; i++) {
        float fi = float(i) + 1.;
        float maxSize = 0.25; // adjust this maximum value as needed
        float r = min(maxSize, uSize + 0.5 * hash(fi));
        vec3 offset = 0.88 * sin(hash3(fi) * uTime);
        res = opSmoothUnion(res, sphere(p-offset, r), 1.0);
        
    }
    return res;
}

vec3 normal(in vec3 p) {
	vec2 e = vec2(1., -1.)*1e-3;
    return normalize(
    	e.xyy * map(p+e.xyy)+
    	e.yxy * map(p+e.yxy)+
    	e.yyx * map(p+e.yyx)+
    	e.xxx * map(p+e.xxx)
    );
}

mat3 lookAt(in vec3 eye, in vec3 tar, in float r) {
	vec3 cz = normalize(tar - eye);
    vec3 cx = normalize(cross(cz, vec3(sin(r), cos(r), 0.)));
    vec3 cy = normalize(cross(cx, cz));
    return mat3(cx, cy, cz);
}

float createPointerBall(vec2 uv, vec2 mousePos, float size) {
    float dist = length(uv - mousePos);
    return smoothstep(size, size - 0.01, dist);
}

void main()
{
    float iorRatio = uIOR;
    
    vec2 uv = vUv;
    vec2 p = (uv * 2.0 - 1.0) * vec2(uResolution.x/uResolution.y, 1.0);    

    vec3 ro = uCamPos;
    vec3 rd = (uCamInverseProjMat * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz;
    rd = (uCamToWorldMat * vec4(rd, 0.0)).xyz;
    rd = normalize(rd);

    float t = 0.;
    for(int i = 0; i < MAX_STEPS; i++) {
        float tmp = map(ro + rd * t);
        
        if(tmp < MIN_DIST || t > MAX_DIST) break;
        t += tmp * 0.9;
    }
  
    if(t > MAX_DIST) {
        // background
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0.0);
    } else {
        // object position
        vec3 pos = ro + rd * t;
        // normal
        vec3 nor = normal(pos);
        // reflection
        vec3 ref = reflect(rd, nor);
        vec3 refOutside = texture2D(iChannel0, ref).rgb;

        // refraction
        // vec3 refractVec = refract(rd, nor, iorRatio);


    vec3 color = vec3(0.);

//     float iorRatioRed = iorRatio + uDispersion;
//     float iorRatioGreen = iorRatio;
//     float iorRatioBlue = iorRatio - uDispersion;

// for ( int i = 0; i < LOOP; i ++ ) {
//   float slide = float(i) / float(LOOP) * 0.1;

//     vec3 refractVecR = refract(rd, nor, iorRatioRed);
//     vec3 refractVecG = refract(rd, nor, iorRatioGreen);
//     vec3 refractVecB = refract(rd, nor, iorRatioBlue);

//     color.r += texture2D(uTexture, uv + refractVecR.xy * (uRefract + slide * 1.0)).r;
//     color.g += texture2D(uTexture, uv + refractVecG.xy * (uRefract + slide * 2.0)).g;
//     color.b += texture2D(uTexture, uv + refractVecB.xy * (uRefract + slide * 3.0)).b;

// }

        vec2 sphereUV = vec2(
            0.5 + atan(pos.z, pos.x) / (2.0 * PI),
            0.5 + asin(pos.y / length(pos) / PI)
        );
        color = texture2D(uNoiseTexture, sphereUV).rgb;

    // Add this line to normalize the colors
    // color /= float(LOOP);

    // fresnel
    float fresnel = pow(1. + dot(rd, nor), uReflection);

    color = mix(color, refOutside, fresnel); 
    
    // color = vec3(fresnel);
    
    color = pow(color, vec3(.465));
    gl_FragColor = vec4(color, 1.);
    }
    // gl_FragColor = vec4(.5);
}

`

export default fragmentShader
