Continuation of my exploration of perlin noise.

So after creating the bodies of water, I needed a way to give them "life". After some googling, I came across this [twitter post](https://twitter.com/TheRujiK/status/1208035937671884800)
and thought it looked badass. So for the most part, that's what I was using for reference.

First things first was creating a way to calculate noise. I'm a lazy, naturaly, so instead of reinventing the wheel 
I found this [awesome resource](https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83) for noise functions.

This was the noise code that was used to generate the follwing image.

```cpp
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  
  return 130.0 * dot(m, g);
}

float OctavePerlin(vec2 v, float persistence) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;  // Used for normalizing result to 0.0 - 1.0
    for(int i = 0; i < 8; i++) {
        total += snoise(v * frequency) * amplitude;
        
        maxValue += amplitude;
        
        amplitude *= persistence;
        frequency *= 2.0;
    }
    
    return total/maxValue;
}
```
Now it's time to start messing around and trying to get this to look like water!

I first started by reducing the number of octaves to 1, which gives it a more "blobby" look.

To give the illusion of movement, we need this bad boy to start scrolling, which is quite simple.

```cpp
float time = u_time;
vec3 color = vec3(0.0);
vec2 vel = vec2(-1.,0.0) * time;

color = vec3(OctavePerlin(pos + vel, 0.5));
```
I then stretch the texture using a scale matrix.

Using two scrolling textures!

```cpp
float time = u_time;
vec3 color = vec3(0.0);

vec2 vel1 = vec2(-1.,0.0)*time;
vec2 vel2 = vec2(1.0,0.0)*time;

color = vec3(OctavePerlin(pos + vel1, 0.5));
color += vec3(OctavePerlin(pos + vel2, 0.5));
```

So the movement and "shape" looks really good to me. Only problem is that this doesn't look like water obviously.
The idea is that this black and white scrolling texture is a height map, so all we need to do is convert this height map into a normal texture.
This is accomplished by using image processing algorithm called the (Sobel operator)[https://en.wikipedia.org/wiki/Sobel_operator]. So by sampling the surrounding pixels
in the image, we can calculate the approximate direction of the normal.

This is the result


The final product with a simple phong shader

This will really come to life with reflections which is the next thing I'm going to tackle.
