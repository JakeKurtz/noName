precision mediump float;

varying vec3 vFragPos;
varying vec4 vFragPosLightSpace;
varying vec3 vNormal;

uniform vec3 viewPos;
uniform int lightToggle;
uniform sampler2D shadowMap;
uniform vec2 shadowMap_size;

uniform vec3 light_pos;
uniform float light_ambient;
uniform float light_diffuse;
uniform float light_specular;
uniform vec3 light_color;
uniform float light_luminacity;

uniform vec3 model_color;

float in_shadow(vec4 fragPosLightSpace) {

    // perform perspective divide
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

    // transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;

    // get closest depth value from light's perspective (using [0,1] range fragPosLight as coords)
    float closestDepth = texture2D(shadowMap, projCoords.xy).r;

    // calculate bias (based on depth map resolution and slope)
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(light_pos - vFragPos);

    float cosTheta = clamp( dot(normal, lightDir), 0.0,1.0 );
    float bias = 0.005 * tan(acos(cosTheta));
    bias = clamp(bias, 0.0, 0.01);

    float shadow = 0.0;
    vec2 texelSize = 1.0 / shadowMap_size;

    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            float pcfDepth = texture2D(shadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += projCoords.z - bias > pcfDepth  ? 1.0 : 0.0;
        }
    }

    shadow /= 9.0;

    // keep the shadow at 0.0 when outside the far_plane region of the light's frustum.
    if(projCoords.z > 1.0)
        shadow = 0.0;

    return shadow;
}

void main() {

    vec3 color = model_color;
    vec3 normal = normalize(vNormal);

    // ambient
    vec3 ambient = vec3(light_ambient);

    // diffuse
    vec3 lightDir = normalize(light_pos - vFragPos);
    float dif = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = vec3(light_diffuse) * dif * light_color;

    // specular
    vec3 viewDir = normalize(viewPos - vFragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(light_specular) * spec * light_color;

    // calculate shadow
    float shadow = in_shadow(vFragPosLightSpace);
    float cosTheta = clamp( dot(normal, lightDir), 0.0, 1.0 );

    //vec3 finalColor = ambient + (1.0-shadow * ((diffuse*cosTheta)+specular));
    vec3 lighting  = (ambient + (1.0-shadow) * (diffuse*cosTheta + specular)) * color * light_luminacity;
    //vec3 lighting  = (ambient + (diffuse*cosTheta + specular)) * color;

    gl_FragColor = vec4(lighting, 1.0);
}