import { mat4, vec3 } from './gl-matrix/src/index.js'

var G = [0.0, 9.80665, 0.0];

function rayPlaneIntersection(rayPos, rayDir, plane) {
    var a = vec3.dot(rayDir, plane.normal);

    if (a >= 0) {
        return null;
    }

    var v = [];
    vec3.sub(v, plane.origin, rayPos);
    var d = vec3.dot(v, plane.normal);
    d = d / a;

    vec3.scale(v, rayDir, d);
    var pointOfIntersection = [];
    vec3.add(pointOfIntersection, rayPos, v);

    return pointOfIntersection
}

function clampForce(out, v, c) {
    if (v.equals([0, 0, 0])) {
        out[0] = 0.0;
        out[1] = 0.0;
        out[2] = 0.0;
        return out;
    }

    var meg = vec3.len(v);
    var clampedMeg = clamp(meg, 0.0, c);
    vec3.normalize(v, v);
    vec3.scale(out, v, clampedMeg);
    return out;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
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

class Plane {
    constructor(origin, normal) {
        this.origin = origin;
        this.normal = normal;
    }
}

class Boid {
    constructor(id, position, velocity) {
        this.id = id;
        this.pos = position;
        this.vel = velocity;
        this.node = null;

        this.lookAheadDist = 10;

        this.norm = [0, 0, 0];
        this.force_avoidance = [0, 0, 0];
        this.force_net = [0, 0, 0];

        this.nbhd = [];
    }

    getBNT() {

        var B = [];
        var T = [];
        var N = [];

        vec3.normalize(T, this.vel);

        vec3.add(N, G, this.force_net);

        var X = [];
        var Y = 0;

        Y = vec3.dot(N, T);
        vec3.scale(X, T, Y);
        vec3.sub(N, N, X);
        vec3.normalize(N, N);
        // N = normalize(N - (dot(N, T) * T));

        vec3.cross(B, T, N);
        vec3.normalize(B, B);

        var mat = mat4.fromValues(
            B[0], B[1], B[2], 0.0,
            N[0], N[1], N[2], 0.0,
            T[0], T[1], T[2], 0.0,
            this.pos[0], this.pos[1], this.pos[2], 1.0,
        );

        return mat;
    }

    seperate(radius, maxSpeed, maxForce) {
        var avgSepForce = [0, 0, 0];
        var n;
        var count = 0;
        for (n of this.nbhd) {
            if (n.id == this.id) { continue; }
            var dist = vec3.dist(this.pos, n.pos);
            if (dist < radius) {
                var sepForce = [];
                vec3.sub(sepForce, this.pos, n.pos);
                vec3.normalize(sepForce, sepForce);
                vec3.scale(sepForce, sepForce, 1.0 / radius**2); // Division by zero!?
                vec3.add(avgSepForce, avgSepForce, sepForce);
                count++;
            }
        }

        if (count > 0) {
            vec3.scale(avgSepForce, avgSepForce, 1.0 / count);
            vec3.normalize(avgSepForce, avgSepForce);
            vec3.scale(avgSepForce, avgSepForce, maxSpeed);

            vec3.sub(avgSepForce, avgSepForce, this.vel);
            var force = [];
            clampForce(force, avgSepForce, maxForce);

            vec3.add(this.force_net, this.force_net, force);
        }
    }

    cohesion(coh_r, sep_r, maxSpeed, maxForce) {
        if (this.nbhd.length != 0) {
            var avgPoint = [0, 0, 0];
            var n;
            var count = 0;
            for (n of this.nbhd) {
                if (n.id == this.id) { continue; }
                var d = vec3.dist(this.pos, n.pos);
                if (d < coh_r && d > sep_r) {
                    vec3.add(avgPoint, avgPoint, n.pos);
                    count++;
                }
            }

            if (count > 0) {

                vec3.scale(avgPoint, avgPoint, 1.0 / count)

                var desired = [0, 0, 0];
                vec3.subtract(desired, avgPoint, this.pos);
                vec3.normalize(desired, desired);
                vec3.scale(desired, desired, maxSpeed);

                vec3.sub(desired, desired, this.vel);
                var force = [];
                clampForce(force, desired, maxForce);

                vec3.add(this.force_net, this.force_net, force);
            }
        }
    }

    align(radius, maxSpeed, maxForce) {
        if (this.nbhd.length != 0) {
            var avgVelocity = [0, 0, 0];
            var count = 0;
            var n;
            for (n of this.nbhd) {
                if (n.id == this.id) { continue; }
                var d = vec3.dist(this.pos, n.pos);
                if (d < radius) {
                    vec3.add(avgVelocity, avgVelocity, n.vel);
                    count++;
                }
            }

            if (count > 0 && !avgVelocity.equals([0, 0, 0])) {
                vec3.scale(avgVelocity, avgVelocity, 1.0 / count);
                vec3.normalize(avgVelocity, avgVelocity);
                vec3.scale(avgVelocity, avgVelocity, maxSpeed);

                vec3.sub(avgVelocity, avgVelocity, this.vel);
                var force = [];
                clampForce(force, avgVelocity, maxForce);

                vec3.add(this.force_net, this.force_net, force);
            }
        }
    }

    wallCollision(walls, maxSpeed, maxForce) {
        var rayPos = [];
        var rayDir = [];
        vec3.normalize(rayDir, this.vel);
        vec3.copy(rayPos, this.pos);

        // Check which wall lays infront
        var wall;
        for (wall of walls) {
            var pointOfIntersection = rayPlaneIntersection(rayPos, rayDir, wall);
            if (pointOfIntersection != null) {
                // check if you're close enough
                var distToWall = vec3.dist(this.pos, pointOfIntersection);
                if (distToWall <= this.lookAheadDist) {
                    // do something to avoid the wall

                    var desired = [];

                    var foo = vec3.dot(wall.normal, this.vel);
                    var bar = vec3.dot(this.vel, this.vel);

                    vec3.scale(desired, this.vel, foo / bar);
                    vec3.sub(desired, wall.normal, desired);

                    vec3.normalize(desired, desired);
                    vec3.scale(desired, desired, maxSpeed);

                    var force = [];
                    vec3.sub(force, desired, this.vel);
                    clampForce(force, force, maxForce);
                    vec3.add(this.force_net, this.force_net, force);
                }
            }
        }
    }

    forceFeild(maxSpeed, maxForce) {
        if (vec3.dist([0, 0, 0], this.pos) > 100.0) {
            var force = []
            vec3.sub(force, [0, 0, 0], this.pos);

            vec3.normalize(force, force);
            vec3.scale(force, force, maxSpeed);

            vec3.sub(force, force, this.vel);
            clampForce(force, force, maxForce);
            vec3.add(this.force_net, this.force_net, force);
        }
    }

    updateNeighbourhood(octree) {

        this.nbhd.length = 0;

        this.nbhd.push.apply(this.nbhd, this.node.objects);

        for (var i = 8; i < 26; i++) {
            if (i <= 7 && i >= 0) {
                var neighbourNode = octree.vertex_neighbour(this.node, i);
                if (neighbourNode != null) {
                    //this.nbhd.push.apply(this.nbhd, neighbourNode.objects);
                }
            }
            else if (i <= 13 && i >= 8) {
                var neighbourNode = octree.face_neighbour(this.node, i);
                if (neighbourNode != null) {
                    this.nbhd.push.apply(this.nbhd, neighbourNode.objects);
                }
            }
            else if (i <= 25 && i >= 14) {
                var neighbourNode = octree.edge_neighbour(this.node, i);
                if (neighbourNode != null) {
                    this.nbhd.push.apply(this.nbhd, neighbourNode.objects);
                }
            }
        }
    }
};

export { Boid, Plane }
