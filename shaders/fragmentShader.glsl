#version 300 es

precision highp int;
precision highp float;

//UNIFORMS
//matrices
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
//transfer function
uniform vec4 uTF;
uniform float uTFOpacity;
uniform vec3 uTFColor;
//light
uniform float uLightLambda;
uniform float uLightPhi;
uniform float uLightRadius;
uniform float uLightDistance;
uniform int uLightNRays;
uniform int uStrategy;
//textures
uniform vec3 uDimensions;
uniform highp sampler3D uVolume;

//VARYINGS
in vec3 vTextureCoord;
in vec4 worldCoord;

out vec4 frag_color;

//TAKEN FROM THE INTERNET
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 randomsample(vec3 L, vec3 p ,int j){
  float radius = uLightRadius*rand(vec2(p)) * float(j);
  radius = radius - float(int(radius));
  float angle = rand(vec2(p)) * 2.0 * 3.141592653589793238 * float(j);
  vec3 offsetx = radius*normalize(vec3(L.z,-L.y,L.x));
  vec3 offsety = radius*normalize(cross(L,offsetx));
  return L+offsetx*sin(angle)+offsety*cos(angle);
}

vec3 gradient(vec3 p){
  //When sampling neighbors, I usually move one voxel in each direction which depends on the dimensions of the texture.

  //sample positive Z axis
  //The cube goes from -1 to 1 and has uDimensions.z samples so the distance I need to move to get the next sample is 2/dimensions.z
  vec3 aux = p + vec3(0,0,2.0/uDimensions.z);
  vec4 texSample = texture(uVolume, (aux+vec3(1,1,1))/2.0);
  
  //For now I use dz as a temporary storage for the value of the neighbor.
  float dz = texSample.r;

  //sample negative Z axis
  aux = p - vec3(0,0,2.0/uDimensions.z);
  texSample = texture(uVolume, (aux+vec3(1,1,1))/2.0);

  //Calculate dz (remember that dz already contained the value of the other sample)
  dz = (dz - texSample.r)/(4.0/uDimensions.z);

  //Same thing for Y axis
  aux = p + vec3(0,2.0/uDimensions.y,0);
  texSample = texture(uVolume, (aux+vec3(1,1,1))/2.0);
  float dy = texSample.r;
  aux = p - vec3(0,2.0/uDimensions.y,0);
  texSample = texture(uVolume, (aux+vec3(1,1,1))/2.0);
  dy = (dy - texSample.r)/(4.0/uDimensions.y);

  //Same thing for X axis
  aux = p + vec3(2.0/uDimensions.x,0,0);
  texSample = texture(uVolume, (aux+vec3(1,1,1))/2.0);
  float dx = texSample.r;
  aux = p - vec3(2.0/uDimensions.x,0,0);
  texSample = texture(uVolume, (aux+vec3(1,1,1))/2.0);
  dx = (dx - texSample.r)/(4.0/uDimensions.x);

  return normalize(vec3(dx,dy,dz));
}

float transferFunction(float a){
    if(a > uTF.r && a < uTF.g) return uTFOpacity * (a-uTF.r)/(uTF.g-uTF.r);
    if(a < uTF.b && a >= uTF.g ) return uTFOpacity;
    if(a < uTF.a && a >= uTF.b) return uTFOpacity * (a-uTF.b)/(uTF.a-uTF.b);
    return 0.0;
}

void main(void) {
  
  highp vec4 texelColor = texture(uVolume, vTextureCoord);
  //frag_color = vec4(vTextureCoord, 1);

  vec4 cameraPosition = inverse(uModelViewMatrix)*vec4(0,0,0,1);
  vec3 c = vec3(cameraPosition);
  vec3 p = vec3(worldCoord);
  vec3 rayDirection = normalize(p-c);
  
  frag_color = vec4(0,0,0,0);

  float opacity;
  vec3 color;
  vec3 Ci = vec3(0.0);
  float ai = 0.0;
  vec3 lightCenter = vec3(sin(uLightPhi)*cos(uLightLambda),sin(uLightPhi)*sin(uLightLambda),cos(uLightPhi))*uLightDistance;
  float samplingDistance = sqrt(2.0/uDimensions.x * 2.0/uDimensions.x + 2.0/uDimensions.y * 2.0/uDimensions.y + 2.0/uDimensions.z * 2.0/uDimensions.z)/2.0;
  int nSamples = int(sqrt(12.0)/samplingDistance)+1;

  vec3 N;
  vec3 L;
  float occlusionFactor, finalocclusionFactor;
  vec3 lightingRayPoint;

  for(int i = 1; 1.0 >= max(p.x, max(p.y,p.z) ) && -1.0 <= min(p.x, min(p.y,p.z) ) && ai < 0.95; ++i){
    p += rayDirection*samplingDistance;
    texelColor = texture(uVolume, (p+vec3(1,1,1))/2.0);

    opacity = transferFunction(texelColor.r);

    N = vec3(1.0);
    L = vec3(1.0);
    finalocclusionFactor = 0.0;
    if(opacity > 0.2 && uLightNRays > 0) {
      N = gradient(p);
      for(int j = 0; j < uLightNRays; ++j){
        occlusionFactor = 0.0;
        L = normalize(lightCenter - p);
        if(uLightNRays > 1) L = randomsample(L, p, j);
        lightingRayPoint = p;
        for(int k = 0; 1.0 >= max(lightingRayPoint.x, max(lightingRayPoint.y,lightingRayPoint.z) ) && -1.0 <= min(lightingRayPoint.x, min(lightingRayPoint.y,lightingRayPoint.z) ) && occlusionFactor < 0.8; ++k){
          lightingRayPoint += L*samplingDistance;
          texelColor = texture(uVolume, (lightingRayPoint+vec3(1,1,1))/2.0);
          occlusionFactor = occlusionFactor + (1.0-occlusionFactor)*transferFunction(texelColor.r);
        }
        if(uStrategy == 0) {if(occlusionFactor >= 0.8) finalocclusionFactor += 1.0;}
        else finalocclusionFactor += occlusionFactor;
      }
      finalocclusionFactor /= float(uLightNRays);
      L = normalize(lightCenter - p);
    }

    Ci = Ci +(1.0-ai)*uTFColor*(1.0-finalocclusionFactor)*max(dot(N,L),0.0)*opacity;
    ai = ai +(1.0-ai)*opacity;
  }
  Ci = Ci*ai;
  frag_color = vec4(Ci,1.0);
  
}

//send the data to the texture!
