precision mediump float;
varying vec3 vTexCoords;
uniform samplerCube skybox;

void main() {
    gl_FragColor = textureCube(skybox, vTexCoords);
}