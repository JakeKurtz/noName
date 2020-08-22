precision mediump float;
uniform vec3 model_color;

void main() {
    gl_FragColor = vec4(model_color, 1.0);
}