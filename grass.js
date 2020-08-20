import { Octree } from './octree.js'
import { Boid, Plane } from './boid.js'
import { camera, d3_obj_instanced, light_directional, compileShader } from './render.js'
import { mat4, vec3 } from './gl-matrix/src/index.js'

var g_boid_time_step = 0.05;

var g_seperation_radius = 3;
var g_alignment_radius = 10;
var g_cohesion_radius = 20;

var g_maxSpeed = 20;
var g_maxForce = 20;

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

function randrange(min, max) {
    return Math.random() * (max - min) + min;
}

//#region Init

// Walls

var volHeight = 50;
var volWidth = 50;
var volDepth = 50;

var wallTop     = new Plane([0, volHeight, 0], [0, -1, 0]);
var wallBottom  = new Plane([0, -volHeight, 0], [0, 1, 0]);
var wallLeft    = new Plane([volWidth, 0, 0], [-1, 0, 0]);
var wallRight   = new Plane([-volWidth, 0, 0], [1, 0, 0]);
var wallNear    = new Plane([0, 0, volDepth], [0, 0, -1]);
var wallFar     = new Plane([0, 0, -volDepth], [0, 0, 1]);

var walls = [wallTop, wallBottom, wallLeft, wallRight, wallNear, wallFar];

var eX = 0;
var eY = 5;
var eZ = 50;

var cam = new camera([eX, eY, eZ]);
var cube = new d3_obj_instanced('cube.obj');
var plane = new d3_obj_instanced('plane.obj');
var boidMesh = new d3_obj_instanced('boid.obj');

boidMesh.color = [1, 0, 0];

var mat = mat4.create();
mat4.scale(mat, mat, [volWidth, volHeight, volDepth]);
cube.addInstance(mat);

var nmb_boids = 1000;
var boids = [];

for (var i = 0; i < nmb_boids; i++) {
    var x = randrange(-1,1) * 15;
    var y = randrange(-1, 1) * 15;
    var z = randrange(-1, 1) * 15;

    var a = Math.random();
    var b = Math.random();
    var c = Math.random();

    boids.push(new Boid(i, [x, y, z], [2*a,2*b,2*c]));
}

for (b of boids) {
    var mat = mat4.fromValues(
        1, 0.0, 0.0, 0.0,
        0.0, 1, 0.0, 0.0,
        0.0, 0.0, 1, 0.0,
        b.pos[0], b.pos[1], b.pos[2], 1.0
    );
    boidMesh.addInstance(mat);
}

var light = new light_directional();
light.enableShadows();

var shader = compileShader("vertex-shader", "fragment-shader");
var shader_basic = compileShader("vs_basic", "fs_basic");

var THETA = 0, PHI = 0;
var time_old = 0;

//#endregion

//#region Controls

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;
var leftmouse = false;
var rightmouse = false;

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

    if (e.button == 0) { leftmouse = true;}
    if (e.button == 1) { rightmouse = true;}

    e.preventDefault();
    return false;
};
var mouseUp = function (e) {
    drag = false;
    if (e.button == 0) { leftmouse = false; }
    if (e.button == 1) { rightmouse = false; }
};
var mouseMove = function (e) {

    //var pan = document.getElementById("radio_pan").checked
    //var rot = document.getElementById("radio_rot").checked

    if (!drag) return false;
    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width,
        dY = (e.pageY - old_y) * 2 * Math.PI / canvas.height;
    old_x = e.pageX, old_y = e.pageY;

    if (leftmouse) {
        THETA += dX;
        PHI += dY;
    }
    if (rightmouse) {
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

mat4.translate(plane.model_matrix, plane.model_matrix, [0, -6, 0]);
mat4.scale(plane.model_matrix, plane.model_matrix, [100, 100, 100]);

var animate = function (time) {

    var octree = new Octree(boids);
    octree.build();

    //#region FRAME SETUP
    resizeCanvas()

    gl.clearColor(1.20, 1.20, 1.20, 1.0);
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    //#endregion

    //#region MANIPULATION
    
    mat4.identity(octree.cube.model_matrix);
    mat4.rotateY(octree.cube.model_matrix, octree.cube.model_matrix, THETA);
    mat4.rotateX(octree.cube.model_matrix, octree.cube.model_matrix, PHI);

    mat4.identity(boidMesh.model_matrix);
    mat4.rotateY(boidMesh.model_matrix, boidMesh.model_matrix, THETA);
    mat4.rotateX(boidMesh.model_matrix, boidMesh.model_matrix, PHI);

    //vec3.rotateY(light.pos, light.pos, [0, 0, 0], 0.01);
    //mat4.lookAt(light.view_matrix, light.pos, [0, 0, 0], [0, 1, 0]);

    //#endregion

    //#region BOIDS

    // Calculate forces //
    var b;
    for (b of boids) {

        b.updateNeighbourhood(octree);

        b.seperate(g_seperation_radius, g_maxSpeed, g_maxForce);
        b.align(g_alignment_radius, g_maxSpeed, g_maxForce);
        b.cohesion(g_cohesion_radius, g_seperation_radius, g_maxSpeed, g_maxForce);

        b.wallCollision(walls, g_maxSpeed, g_maxForce);
    }
    
    // Euler integration //
    var b;
    for (b of boids) {
        var a = [];
        vec3.scale(a, b.force_net, g_boid_time_step);
        vec3.add(b.vel, b.vel, a);

        var a = [];
        vec3.scale(a, b.vel, g_boid_time_step);
        vec3.add(b.pos, b.pos, a);

        b.force_net = [0, 0, 0];
    }
    
    boidMesh.clearInstances();
    var b;
    for (b of boids) {
        var boidMatrix = b.getBNT();
        mat4.scale(boidMatrix, boidMatrix, [0.3,0.3,0.3]);
        boidMesh.addInstance(boidMatrix);
    }
    
    //#endregion
    
    //#region SHADOW MAPS
    /*
    gl.cullFace(gl.FRONT);

    light.sendShadowUniforms();
    light.renderShadowMap([
        boidMesh
    ]);

    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.cullFace(gl.BACK);
    */
    //#endregion

    //#region RENDER
    gl.useProgram(shader);
    gl.uniform1i(gl.getUniformLocation(shader, "shadowMap"), 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, light.depthMap);

    cam.pan([eX, eY, eZ]);

    cam.sendUniforms(shader)

    light.sendUniforms(shader, cam);

    boidMesh.render(shader);
    //cube.render(shader);

    //#region Octree debug

    //gl.useProgram(shader_basic);
    //cam.sendUniforms(shader_basic)
    //octree.cube.render(shader_basic);

    //#endregion

    //#endregion

    window.requestAnimationFrame(animate);
}

animate(0);
