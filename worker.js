var g_boid_time_step = 0.05;

var g_seperation_radius = 2;
var g_alignment_radius = 3;
var g_cohesion_radius = 5;

var g_maxSpeed = 6;

var g_maxForce = 10;

// dist
function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
}
function sub(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
}
function scale(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
}
function normalize(out, a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
}
function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
}
function dist(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return Math.hypot(x, y, z);
}
function len(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return Math.hypot(x, y, z);
}

Array.prototype.equals = function (array) {
    if (!array)
        return false;

    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            return false;
        }
    }
    return true;
}

function clampForce(out, v, c) {
    if (v.equals([0, 0, 0])) {
        out[0] = 0.0;
        out[1] = 0.0;
        out[2] = 0.0;
        return out;
    }

    var meg = len(v);
    var clampedMeg = clamp(meg, 0.0, c);
    normalize(v, v);
    scale(out, v, clampedMeg);
    return out;
}
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function seperate(boid, radius, maxSpeed, maxForce) {
    var avgSepForce = [0, 0, 0];
    var n;
    for (n of boid.nbhd) {
        if (n.id == boid.id) { continue; }
        if (dist(boid.pos, n.pos) < radius) {
            var sepForce = [];
            var d = dist(boid.pos, n.pos);
            sub(sepForce, boid.pos, n.pos);
            normalize(sepForce, sepForce);
            scale(sepForce, sepForce, 1.0 / d); // Division by zero!?
            add(avgSepForce, avgSepForce, sepForce);
        }
    }
    if (boid.nbhd.length > 1 && !avgSepForce.equals([0, 0, 0])) {

        scale(avgSepForce, avgSepForce, 1.0 / boid.nbhd.length);
        normalize(avgSepForce, avgSepForce);
        scale(avgSepForce, avgSepForce, maxSpeed);

        sub(avgSepForce, avgSepForce, boid.vel);
        var force = [];
        clampForce(force, avgSepForce, maxForce);

        add(boid.force_net, boid.force_net, force);
    }
}
function cohesion(boid, coh_r, sep_r, maxSpeed, maxForce) {
    if (boid.nbhd.length != 0) {
        var avgPoint = [0, 0, 0];
        var n;
        for (n of boid.nbhd) {
            if (n.id == boid.id) { continue; }
            var d = dist(boid.pos, n.pos);
            if (d < coh_r && d > sep_r)
                add(avgPoint, avgPoint, n.pos);
        }
        if (boid.nbhd.length > 0 && !avgPoint.equals([0, 0, 0])) {

            scale(avgPoint, avgPoint, 1.0 / boid.nbhd.length)

            var desired = [0, 0, 0];
            sub(desired, avgPoint, boid.pos);
            normalize(desired, desired);
            scale(desired, desired, maxSpeed);

            sub(desired, desired, boid.vel);
            var force = [];
            clampForce(force, desired, maxForce);

            add(boid.force_net, boid.force_net, force);
        }
    }
}
function align(boid, radius, maxSpeed, maxForce) {
    if (boid.nbhd.length != 0) {
        var avgVelocity = [0, 0, 0];
        var size = 0.0;
        var n;
        for (n of boid.nbhd) {
            if (n.id == boid.id) { continue; }
            var d = dist(boid.pos, n.pos);
            if (d < radius) {
                add(avgVelocity, avgVelocity, n.vel);
                size++;
            }
        }

        if (size > 0 && !avgVelocity.equals([0, 0, 0])) {
            scale(avgVelocity, avgVelocity, 1.0 / size);
            normalize(avgVelocity, avgVelocity);
            scale(avgVelocity, avgVelocity, maxSpeed);

            sub(avgVelocity, avgVelocity, boid.vel);
            var force = [];
            clampForce(force, avgVelocity, maxForce);

            add(boid.force_net, boid.force_net, force);
        }
    }
}
function wallCollision(boid, walls, maxSpeed, maxForce) {
    var rayPos = [];
    var rayDir = [];
    normalize(rayDir, boid.vel);
    copy(rayPos, boid.pos);

    // Check which wall lays infront
    var wall;
    for (wall of walls) {
        var pointOfIntersection = rayPlaneIntersection(rayPos, rayDir, wall);
        if (pointOfIntersection != null) {
            // check if you're close enough
            var distToWall = dist(boid.pos, pointOfIntersection);
            if (distToWall <= boid.lookAheadDist) {
                // do something to avoid the wall
                //var force = [];
                //scale(force, this.vel, -1);
                //add(this.force_net, this.force_net, force);
                scale(boid.vel, boid.vel, -1);
                break;
            }
        }
    }
}
function updateNeighbourhood(boid, octree) {

    boid.nbhd.length = 0;

    boid.nbhd.push.apply(boid.nbhd, boid.node.objects);

    for (var i = 0; i < 26; i++) {
        if (i <= 7 && i >= 0) {
            var neighbourNode = octree.vertex_neighbour(boid.node, i);
            if (neighbourNode != null) {
                boid.nbhd.push.apply(boid.nbhd, neighbourNode.objects);
            }
        }
        else if (i <= 13 && i >= 8) {
            var neighbourNode = octree.face_neighbour(boid.node, i);
            if (neighbourNode != null) {
                boid.nbhd.push.apply(boid.nbhd, neighbourNode.objects);
            }
        }
        else if (i <= 25 && i >= 14) {
            var neighbourNode = octree.edge_neighbour(boid.node, i);
            if (neighbourNode != null) {
                boid.nbhd.push.apply(boid.nbhd, neighbourNode.objects);
            }
        }
    }
}

self.addEventListener('message', function (e) {

    var boids = e.data;

    // Calculate forces //
    var b;
    for (b of boids) {

        //updateNeighbourhood(b, octree);

        seperate(b, g_seperation_radius, g_maxSpeed, 20);
        align(b, g_alignment_radius, g_maxSpeed, 5);
        cohesion(b, g_cohesion_radius, g_seperation_radius, g_maxSpeed, 2);

        //wallCollision(b, walls, g_maxSpeed, g_maxForce);
    }

    // Euler integration //
    var b;
    for (b of boids) {
        var a = [];
        scale(a, b.force_net, g_boid_time_step);
        add(b.vel, b.vel, a);

        var a = [];
        scale(a, b.vel, g_boid_time_step);
        add(b.pos, b.pos, a);

        b.force_net = [0, 0, 0];
    }

    //console.log("FORCE NET", boids[0].force_net);
    //console.log("VELOCITY", boids[0].vel);
    //console.log("POSITION", boids[0].pos);

    self.postMessage(boids);
    self.close();

});