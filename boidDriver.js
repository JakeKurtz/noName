import { Octree } from './octree.js'
import { Boid, Plane } from './boid.js'
import { Camera, ObjectInstanced3D, LightDir, compileShader, Skybox } from './render.js'
import { glMatrix, mat4, vec3 } from './gl-matrix/src/index.js'

glMatrix.setMatrixArrayType(Array);

var g_boid_time_step = 0.05;

var g_seperation_radius = 3;
var g_alignment_radius = 20;
var g_cohesion_radius = 50;

var g_maxSpeed = 30;
var g_maxForce = 15;

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

function addBoids(nmb_boids, boids) {

    var numberToAdd = nmb_boids - boids.length;
    var idStart = nmb_boids;

    for (var i = 0; i < numberToAdd; i++) {
        var x = randrange(-1, 1) * 50;
        var y = randrange(-1, 1) * 50;
        var z = randrange(-1, 1) * 50;

        var a = Math.random();
        var b = Math.random();
        var c = Math.random();

        boids.push(new Boid(i+idStart, [x, y + yoffset, z], [2 * a, 2 * b, 2 * c]));
    }
}

function killBoids(nmb_boids, boids) {
    boids.length = nmb_boids;
}

//#region Init

// Skybox

var faces = [
    "./graphics/skybox/right.jpg",
    "./graphics/skybox/left.jpg",
    "./graphics/skybox/top.jpg",
    "./graphics/skybox/bottom.jpg",
    "./graphics/skybox/front.jpg",
    "./graphics/skybox/back.jpg"];
var sky = new Skybox(faces);

// Walls

var yoffset = 50;

var volHeight = 50;
var volWidth = 50;
var volDepth = 50;

var wallTop = new Plane([0, volHeight + yoffset, 0], [0, -1, 0]);
var wallBottom = new Plane([0, -volHeight + yoffset, 0], [0, 1, 0]);
var wallLeft = new Plane([volWidth, yoffset, 0], [-1, 0, 0]);
var wallRight = new Plane([-volWidth, yoffset, 0], [1, 0, 0]);
var wallNear = new Plane([0, yoffset, volDepth], [0, 0, -1]);
var wallFar = new Plane([0, yoffset, -volDepth], [0, 0, 1]);

var walls = [wallTop, wallBottom, wallLeft, wallRight, wallNear, wallFar];

var use_fancy = true;
var use_optimal = false;
var show_octree = true;

var eX = 0;
var eY = 0;
var eZ = 0;
var zoom = 110;

var cam = new Camera([eX, eY, eZ], zoom);
var cube = new ObjectInstanced3D('cube.obj');
var boidMesh = new ObjectInstanced3D('boid.obj');

boidMesh.color = [1, 1, 1];

var mat = mat4.create();
mat4.scale(mat, mat, [1, 1, 1]);
mat4.translate(mat,mat,[100,100,100]);
cube.addInstance(mat);

var nmb_boids = 500;
var nmb_boids_old = nmb_boids;
var boids = [];

for (var i = 0; i < nmb_boids; i++) {
    var x = randrange(-1,1) * 15;
    var y = randrange(-1, 1) * 15;
    var z = randrange(-1, 1) * 15;

    var a = Math.random();
    var b = Math.random();
    var c = Math.random();

    boids.push(new Boid(i, [x, y + yoffset, z], [a,b,c]));
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

var light = new LightDir();
light.enableShadows();

var shader = compileShader("vs_pulcher", "fs_pulcher");
var shader_basic = compileShader("vs_optimal", "fs_optimal");

var THETA = 0, PHI = 0;
var time_old = 0;

//#endregion

//#region Controls

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;

var yaw = 0, pitch = 90, sensitivity = 15;

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
            if (curDiff > prevDiff && zoom > 5) {
                zoom -= 1;
            }
            if (curDiff < prevDiff && zoom < 150) {
                zoom += 1;
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

    if (!drag) return false;

    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width;
    dY = (e.pageY - old_y) * 2 * Math.PI / canvas.height;
    old_x = e.pageX;
    old_y = e.pageY;

    yaw -= dX * sensitivity;
    pitch += dY * sensitivity;

    if (pitch > 89.0) pitch = 89.0;
    if (pitch < -89.0) pitch = -89.0;

    THETA += dX;
    PHI += dY;

    e.preventDefault();
};
var mouseScroll = function (e) {
    var direction = (e.deltaY < 0) ? 1 : -1;
    if (direction == -1 && zoom < 150) { zoom += 1; }
    if (direction == 1 && zoom > 5) { zoom -= 1; }
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

    if (!drag) return false;
    dX = (e.touches[0].pageX - old_x) * 2 * Math.PI / canvas.width;
    dY = (e.touches[0].pageY - old_y) * 2 * Math.PI / canvas.height;
    old_x = e.touches[0].pageX, old_y = e.touches[0].pageY;

    yaw -= dX * sensitivity;
    pitch += dY * sensitivity;

    if (pitch > 89.0) pitch = 89.0;
    if (pitch < -89.0) pitch = -89.0;

    THETA += dX;
    PHI += dY;

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

    use_fancy = document.getElementById("radio_fancy").checked;
    use_optimal = document.getElementById("radio_optimal").checked;
    show_octree = document.getElementById("show_octree").checked;
    nmb_boids = Number(document.getElementById("slider_boids").value);
    g_boid_time_step = Number(document.getElementById("slider_time").value) / 1000.0;

    if (nmb_boids != nmb_boids_old) {
        if (nmb_boids > nmb_boids_old) { addBoids(nmb_boids, boids) }
        else { killBoids(nmb_boids, boids) }
        nmb_boids_old = nmb_boids;
    }

    var octree = new Octree(boids, 6, [0, yoffset, 0], 100, show_octree);
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

    cam.zoom(zoom);
    cam.rotate(yaw, pitch);

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
        b.forceFeild(g_maxSpeed, g_maxForce);
    }
    
    // Euler integration //
    for (b of boids) {
        var a = [];
        vec3.scale(a, b.force_net, g_boid_time_step);
        vec3.add(b.vel, b.vel, a);

        var a = [];
        vec3.scale(a, b.vel, g_boid_time_step);
        vec3.add(b.pos, b.pos, a);

        b.force_net = [0, 0, 0];
    }

    // Set up rendering //
    boidMesh.clearInstances();
    for (b of boids) {
        var boidMatrix = b.getBNT();
        mat4.scale(boidMatrix, boidMatrix, [0.6,0.6,0.6]);
        boidMesh.addInstance(boidMatrix);
    }
    
    //#endregion

    //#region RENDER

    if (use_fancy) {

        //#region SHADOW MAPS

        gl.cullFace(gl.FRONT);

        light.sendShadowUniforms();
        light.renderShadowMap([
            boidMesh
        ]);

        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.cullFace(gl.BACK);

        //#endregion

        gl.useProgram(shader);
        gl.uniform1i(gl.getUniformLocation(shader, "shadowMap"), 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, light.depthMap);
        cam.sendUniforms(shader);

        light.sendUniforms(shader, cam);
        boidMesh.render(shader);

    } else if (use_optimal) {

        gl.useProgram(shader_basic);
        cam.sendUniforms(shader_basic);

        boidMesh.render(shader_basic);
    }

    //#region Octree visualization

    if (show_octree) {
        gl.useProgram(shader_basic);

        cam.sendUniforms(shader_basic);
        octree.cube.render(shader_basic);
        octree.cube.clearInstances();
    }

    //#endregion

    // Skybox
    sky.render(cam.proj_matrix, cam.view_matrix);

    //#endregion

    octree = null;
    window.requestAnimationFrame(animate);
}

animate(0);
