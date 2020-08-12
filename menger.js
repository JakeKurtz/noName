import { glMatrix, mat4, vec3 } from './gl-matrix/src/index.js'
import { perspective } from './gl-matrix/src/mat4.js';

var canvas = document.getElementById('my_Canvas');
var gl = canvas.getContext('webgl2');

function resizeCanvas() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (canvas.width != width ||
        canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
}

function compileShader(vertex_shader, fragment_shader) {

    var vertCode = document.getElementById(vertex_shader).text;;
    var fragCode = document.getElementById(fragment_shader).text;;

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    var shader = gl.createProgram();
    gl.attachShader(shader, vertShader);
    gl.attachShader(shader, fragShader);
    gl.linkProgram(shader);

    return shader;
}

class camera {
    constructor(pos, lookat, up, fov, proj) {
        this.pos = pos || [0, 0, 0];
        this.lookat = lookat || [0, 0, 0];
        this.up = up || [0, 1, 0];
        this.fov = fov || 45;
        this.proj = proj || perspective;

        this.view_matrix = [];
        this.proj_matrix = [];

        mat4.lookAt(this.view_matrix, this.pos, this.lookat, this.up);

        var canvas = document.getElementById('my_Canvas');

        if (this.proj == perspective) {
            mat4.perspective(this.proj_matrix, this.fov, canvas.width / canvas.height, 0.1, 100);
        } else if (this.proj == orthographic) {
            ortho(this.proj_matrix, 0.0, canvas.width, canvas.height, 0, 1.0, 100.0)
        }
    }

    pan(pos) {
        this.pos = pos;
        mat4.perspective(this.proj_matrix, this.fov, canvas.width / canvas.height, 0.1, 100);
        mat4.lookAt(this.view_matrix, pos, [pos[0], pos[1], 0], this.up); 
    }

    sendUniforms(shader) {
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "proj_matrix"), false, this.proj_matrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "view_matrix"), false, this.view_matrix);
    }
}
class d3_obj_instanced {
    constructor(vertices, normals, colors, indices, offsets) {

        // Vertex buffer
        this.vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Normal buffer
        this.normal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // Color buffer
        this.color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        // Offset buffer
        this.offset_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.offset_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsets), gl.STATIC_DRAW);

        this.offsetLocation;
        this.offsetLocation1;
        this.offsetLocation2;
        this.offsetLocation3;

        // Index buffer
        this.index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.model_matrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];

        this.indices = indices;
        this.instanceCount = 0;
    }

    setUpAttributes(shader, positions=true, normals=true, colors=true, offsets=true) {

        gl.useProgram(shader);

        if (positions) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
            var _position = gl.getAttribLocation(shader, "position");
            gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(_position);
            //console.log("position");
        }
        if (normals) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
            var _normal = gl.getAttribLocation(shader, "normal");
            gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(_normal);
            //console.log("normal");
        }
        if (colors) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
            var _color = gl.getAttribLocation(shader, "color");
            gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(_color);
            //console.log("color");
        }
        if (offsets) {
            //console.log("offset");
            gl.bindBuffer(gl.ARRAY_BUFFER, this.offset_buffer);
            this.offsetLocation = gl.getAttribLocation(shader, "offset");
            this.offsetLocation1 = this.offsetLocation + 1;
            this.offsetLocation2 = this.offsetLocation + 2;
            this.offsetLocation3 = this.offsetLocation + 3;

            var floatsPerRow = 4
            var bytesPerRow = floatsPerRow * 4;
            var bytesPerMatrix = bytesPerRow * 4;

            gl.vertexAttribPointer(this.offsetLocation, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, 0);
            gl.enableVertexAttribArray(this.offsetLocation);

            gl.vertexAttribPointer(this.offsetLocation1, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, (1 * bytesPerRow));
            gl.enableVertexAttribArray(this.offsetLocation1);

            gl.vertexAttribPointer(this.offsetLocation2, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, (2 * bytesPerRow));
            gl.enableVertexAttribArray(this.offsetLocation2);

            gl.vertexAttribPointer(this.offsetLocation3, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, (3 * bytesPerRow));
            gl.enableVertexAttribArray(this.offsetLocation3);

            gl.vertexAttribDivisor(this.offsetLocation, 1);
            gl.vertexAttribDivisor(this.offsetLocation1, 1);
            gl.vertexAttribDivisor(this.offsetLocation2, 1);
            gl.vertexAttribDivisor(this.offsetLocation3, 1);
        }
    }

    render(shader) {

        gl.useProgram(shader);

        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "model_matrix"), false, this.model_matrix);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.drawElementsInstanced(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0, this.instanceCount);

        gl.vertexAttribDivisor(this.offsetLocation, 0);
        gl.vertexAttribDivisor(this.offsetLocation1, 0);
        gl.vertexAttribDivisor(this.offsetLocation2, 0);
        gl.vertexAttribDivisor(this.offsetLocation3, 0);

    }
    postrender() {
        gl.vertexAttribDivisor(offsetLocation, 0);
        gl.vertexAttribDivisor(offsetLocation1, 0);
        gl.vertexAttribDivisor(offsetLocation2, 0);
        gl.vertexAttribDivisor(offsetLocation3, 0);
    }
}
class light_directional {
    constructor(pos, color, ambient, diffuse, specular, shadows, toggle) {
        this.pos = pos || [5, 5, 5];
        this.color = color || [240 / 255, 243 / 255, 189/255];
        this.ambient = ambient || 0.3;
        this.diffuse = diffuse || 1;
        this.specular = specular || 1;
        this.shadows = shadows || true;
        this.toggle = toggle || true;

        this.view_matrix = [];
        this.proj_matrix = [];

        this.depthShader = null;
        this.depthMapFBO = null;
        this.depthMap = null
        this.SHADOW_WIDTH = 2048;
        this.SHADOW_HEIGHT = 2048;
    }

    enableShadows() {

        this.depthMapFBO = gl.createFramebuffer();

        // 2D texture for shadow map
        this.depthMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, this.SHADOW_WIDTH, this.SHADOW_HEIGHT, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthMapFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthMap, 0);
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Light space matrix

        mat4.ortho(this.proj_matrix, -10, 10, -10, 10, 0.1, 100);
        mat4.lookAt(this.view_matrix, this.pos, [0,0,0], [0, 1, 0]);

        this.depthShader = compileShader("vs_shadowmap_depth", "fs_shadowmap_depth");
    }

    sendUniforms(shader, cam) {
        gl.useProgram(shader);

        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "lightSpaceView_matrix"), false, this.view_matrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "lightSpaceProj_matrix"), false, this.proj_matrix);

        gl.uniform3fv(gl.getUniformLocation(shader, "viewPos"), cam.pos);

        gl.uniform3fv(gl.getUniformLocation(shader, "light_pos"), this.pos);
        gl.uniform1f(gl.getUniformLocation(shader, "light_ambient"), this.ambient);
        gl.uniform1f(gl.getUniformLocation(shader, "light_diffuse"), this.diffuse);
        gl.uniform1f(gl.getUniformLocation(shader, "light_specular"), this.specular);
        gl.uniform3fv(gl.getUniformLocation(shader, "light_color"), this.color);
        gl.uniform1i(gl.getUniformLocation(shader, "lightToggle"), this.toggle);
        gl.uniform1i(gl.getUniformLocation(shader, "shadowMap"), 0);
        gl.uniform2f(gl.getUniformLocation(shader, "shadowMap_size"), this.SHADOW_WIDTH, this.SHADOW_HEIGHT);
    }

    sendShadowUniforms() {
        gl.useProgram(this.depthShader);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.depthShader, "proj_matrix"), false, this.proj_matrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.depthShader, "view_matrix"), false, this.view_matrix);
    }

    renderShadowMap(objects) {

        gl.useProgram(this.depthShader);

        gl.viewport(0, 0, this.SHADOW_WIDTH, this.SHADOW_HEIGHT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthMapFBO);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        var obj;
        for (obj of objects) {
            obj.render(this.depthShader);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

glMatrix.setMatrixArrayType(Array);
function createMenger(scale, offset, depth) {
    var offsets = [];

    if (depth == 0) {
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                for (var k = 0; k < 3; k++) {

                    if ((i - 1) % 3 == 0 && (j - 1) % 3 == 0) { continue }
                    if ((k - 1) % 3 == 0 && (j - 1) % 3 == 0) { continue }
                    if ((k - 1) % 3 == 0 && (i - 1) % 3 == 0) { continue }

                    var mat = mat4.create();
                    mat4.translate(mat, mat, [
                        i * 2 * scale + offset[0],
                        j * 2 * scale + offset[1],
                        k * 2 * scale + offset[2]
                    ]);
                    mat4.scale(mat, mat, [scale, scale, scale]);

                    offsets = offsets.concat(mat);
                }
            }
        }
        return offsets
    }
    else {
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                for (var k = 0; k < 3; k++) {

                    if ((i - 1) % 3 == 0 && (j - 1) % 3 == 0) { continue }
                    if ((k - 1) % 3 == 0 && (j - 1) % 3 == 0) { continue }
                    if ((k - 1) % 3 == 0 && (i - 1) % 3 == 0) { continue }

                    offsets = offsets.concat(createMenger(scale / 3.0, [i * 2 * scale + offset[0], j * 2 * scale + offset[1], k * 2 * scale + offset[2]], depth - 1))
                }
            }
        }
        return offsets
    }
}
function updateMenger(menger, depth) {

    var offsets = []
    var scale = 1;

    if (depth == 0) {
        offsets = [
            3 * scale, 0, 0, 0,
            0, 3 * scale, 0, 0,
            0, 0, 3 * scale, 0,
            0, 0, 0, 1];
    } else {
        var center = (Math.floor(Math.pow(3, depth) / 2) * 2 / Math.pow(3, depth-1)) * scale;
        offsets = createMenger(scale, [-center, -center, -center], depth-1);
    }

    //var scale = 1;
    //var center = (Math.floor(Math.pow(3, depth + 1) / 2) * 2 / Math.pow(3, depth)) * scale;
    //offsets = createMenger(scale, [-center, -center, -center], depth);
    menger.instanceCount = offsets.length / 16;

    gl.bindBuffer(gl.ARRAY_BUFFER, menger.offset_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsets), gl.STATIC_DRAW);
}

//#region Init

var cubeVertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
    1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
    -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
    -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
];
var colors = [
    2 / 255, 128 / 255, 144 / 255, 2 / 255, 128 / 255, 144 / 255, 2 / 255, 128 / 255, 144 / 255, 2 / 255, 128 / 255, 144 / 255,
    2 / 255, 128 / 255, 144 / 255, 2 / 255, 128 / 255, 144 / 255, 2 / 255, 128 / 255, 144 / 255, 2 / 255, 128 / 255, 144 / 255,
    0 / 255, 168 / 255, 150 / 255, 0 / 255, 168 / 255, 150 / 255, 0 / 255, 168 / 255, 150 / 255, 0 / 255, 168 / 255, 150 / 255,
    0 / 255, 168 / 255, 150 / 255, 0 / 255, 168 / 255, 150 / 255, 0 / 255, 168 / 255, 150 / 255, 0 / 255, 168 / 255, 150 / 255,
    2 / 255, 195 / 255, 154 / 255, 2 / 255, 195 / 255, 154 / 255, 2 / 255, 195 / 255, 154 / 255, 2 / 255, 195 / 255, 154 / 255,
    2 / 255, 195 / 255, 154 / 255, 2 / 255, 195 / 255, 154 / 255, 2 / 255, 195 / 255, 154 / 255, 2 / 255, 195 / 255, 154 / 255,
];
var indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
];
var normals = [
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
];

var eX = 0;
var eY = 0;
var eZ = 15;

var cam = new camera([eX, eY, eZ]);
var menger = new d3_obj_instanced(cubeVertices, normals, colors, indices, []);
var light = new light_directional();
light.enableShadows();

var shader = compileShader("vertex-shader", "fragment-shader");

menger.setUpAttributes(light.depthShader, true, false,false,true);
menger.setUpAttributes(shader);

var THETA = 0, PHI = 0;
var time_old = 0;
var depth_old = -1;

//#endregion

//#region Controls

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;

var evCache = new Array();
var prevDiff = -1;

canvas.onpointerdown = pointerdown_handler;
canvas.onpointermove = pointermove_handler;
canvas.onpointerup = pointerup_handler;
canvas.onpointercancel = pointerup_handler;
canvas.onpointerout = pointerup_handler;
canvas.onpointerleave = pointerup_handler;

function pointermove_handler(e) {
    // Find this event in the cache and update its record with this event
    for (var i = 0; i < evCache.length; i++) {
        if (e.pointerId == evCache[i].pointerId) {
            evCache[i] = e;
            break;
        }
    }

    // If two pointers are down, check for pinch gestures
    if (evCache.length == 2) {
        // Calculate the distance between the two pointers
        var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

        if (prevDiff > 0) {
            if (curDiff > prevDiff) {
                eZ -= 0.1;
            }
            if (curDiff < prevDiff) {
                eZ += 0.1;
            }
        }
        // Cache the distance for the next move event 
        prevDiff = curDiff;
    }

}
function pointerdown_handler(ev) {
    evCache.push(ev);
}
function pointerup_handler(ev) {
    console.log(ev.type, ev);
    remove_event(ev);
    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 2) prevDiff = -1;
}
function remove_event(ev) {
    // Remove this event from the target's cache
    for (var i = 0; i < evCache.length; i++) {
        if (evCache[i].pointerId == ev.pointerId) {
            evCache.splice(i, 1);
            break;
        }
    }
}

var mouseDown = function (e) {
    drag = true;
    old_x = e.pageX, old_y = e.pageY;

    e.preventDefault();
    return false;
};
var mouseUp = function (e) {
    drag = false;
};
var mouseMove = function (e) {

    var pan = document.getElementById("radio_pan").checked
    var rot = document.getElementById("radio_rot").checked

    if (!drag) return false;
    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width,
        dY = (e.pageY - old_y) * 2 * Math.PI / canvas.height;
    old_x = e.pageX, old_y = e.pageY;

    if (rot) {
        THETA += dX;
        PHI += dY;
    }
    if (pan) {
        eY += dY * 2;
        eX -= dX * 2;
    }

    e.preventDefault();
};
var mouseScroll = function (e) {
    var direction = (e.deltaY < 0) ? 1 : -1;
    if (direction == -1) { eZ += 0.1; }
    if (direction == 1) { eZ -= 0.1; }
    e.preventDefault();
}

var fingerDown = function (e) {

    drag = true;
    old_x = e.touches[0].pageX, old_y = e.touches[0].pageY;

    e.preventDefault();
    return false;
}
var fingerUp = function (e) {
    drag = false;
}
var fingerMove = function (e) {
    var pan = document.getElementById("radio_pan").checked
    var rot = document.getElementById("radio_rot").checked

    if (!drag) return false;
    dX = (e.touches[0].pageX - old_x) * 2 * Math.PI / canvas.width;
    dY = (e.touches[0].pageY - old_y) * 2 * Math.PI / canvas.height;
    old_x = e.touches[0].pageX, old_y = e.touches[0].pageY;

    
    if (rot) {
        THETA += dX;
        PHI += dY;
    }
    if (pan) {
        eY += dY * 2;
        eX -= dX * 2;
    }
    
    e.preventDefault();
}

canvas.addEventListener("touchstart", fingerDown, false);
canvas.addEventListener("touchend", fingerUp, false);
canvas.addEventListener("touchmove", fingerMove, false);

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("mouseout", mouseUp, false);
canvas.addEventListener("mousemove", mouseMove, false);

canvas.addEventListener('DOMMouseScroll', mouseScroll, false); // older FF
canvas.addEventListener('wheel', mouseScroll, false); // modern desktop

//#endregion

var animate = function (time) {

    resizeCanvas()

    gl.clearColor(0.20, 0.20, 0.20, 1.0);
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!drag && document.getElementById("radio_rot").checked) {
        dX *= AMORTIZATION, dY *= AMORTIZATION;
        THETA += dX, PHI += dY;
    }

    var depth = Number(document.getElementById("slider").value);
    if (depth != depth_old) {
        updateMenger(menger, depth);
        depth_old = depth;
    }

    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(menger.model_matrix);
    mat4.rotateY(menger.model_matrix, menger.model_matrix, THETA);
    mat4.rotateX(menger.model_matrix, menger.model_matrix, PHI);

    time_old = time;
    gl.enable(gl.DEPTH_TEST);

    menger.setUpAttributes(light.depthShader, true, false, false, true);
    light.sendShadowUniforms();
    light.renderShadowMap([menger]);
    
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shader);
    gl.uniform1i(gl.getUniformLocation(shader, "shadowMap"), 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, light.depthMap);

    cam.pan([eX, eY, eZ]);
    cam.sendUniforms(shader)

    menger.setUpAttributes(shader);

    light.sendUniforms(shader, cam);
    menger.render(shader);
    
    window.requestAnimationFrame(animate);

}

animate(0);
