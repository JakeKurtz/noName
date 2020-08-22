attribute vec3 position;

uniform mat4 proj_matrix;
uniform mat4 view_matrix;

varying vec3 vTexCoords;

void main() {
    vTexCoords = position;
    gl_Position = proj_matrix * view_matrix * vec4(position, 0.01);
}