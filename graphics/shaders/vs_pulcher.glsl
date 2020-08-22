attribute vec3 position;
attribute vec3 normal;
attribute mat4 offset;

uniform mat4 proj_matrix;
uniform mat4 view_matrix;
uniform mat4 model_matrix;
uniform mat4 lightSpaceView_matrix;
uniform mat4 lightSpaceProj_matrix;

varying vec3 vFragPos;
varying vec4 vFragPosLightSpace;
//varying vec3 vColor;
varying vec3 vNormal;

void main() {
    mat4 mo = model_matrix * offset;
    mat4 mvp = proj_matrix * view_matrix * mo;

    mat4 lightMVP = lightSpaceProj_matrix * lightSpaceView_matrix;

    gl_Position = mvp * vec4(position, 1.0);
    vFragPos = vec3(mo * vec4(position, 1.0));
    vFragPosLightSpace = lightMVP * vec4(vFragPos, 1.0);
    //vColor = color;
    vNormal = mat3(mo) * normal;
}