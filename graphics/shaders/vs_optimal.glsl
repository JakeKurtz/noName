attribute vec3 position;
attribute vec3 normal;
attribute mat4 offset;

uniform mat4 proj_matrix;
uniform mat4 view_matrix;
uniform mat4 model_matrix;

void main() {
    mat4 mvp = proj_matrix * view_matrix * model_matrix * offset;
    gl_Position = mvp * vec4(position, 1.0);
}