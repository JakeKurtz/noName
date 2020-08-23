import { glMatrix, mat4, vec3, quat } from './gl-matrix/src/index.js'
import { perspective } from './gl-matrix/src/mat4.js';

var canvas = document.getElementById('my_Canvas');
var gl = canvas.getContext('webgl2');

glMatrix.setMatrixArrayType(Array);

function loadOBJ(obj, filename) {

    var vertices_tmp = [];
    var texcoords_tmp = [];
    var normals_tmp = [];

    var vertex_indices = [];
    var texcoord_indices = [];
    var normal_indices = [];

    var vertex_out = [];
    var texcoord_out = [];
    var normal_out = [];

    var objStr = document.getElementById(filename).innerHTML;
    objStr = objStr.split("\n");

    var line;
    for (line of objStr) {
        var terms = line.trim().split(' ');
        switch (terms[0]) {
            case "v":
                vertices_tmp.push.apply(vertices_tmp, [[Number(terms[1]), Number(terms[2]), Number(terms[3])]]);
                break;
            case "vt":
                texcoords_tmp.push.apply(texcoords_tmp, [[Number(terms[1]), Number(terms[2])]]);
                break;
            case "vn":
                normals_tmp.push.apply(normals_tmp, [[Number(terms[1]), Number(terms[2]), Number(terms[3])]]);
                break;
            case "f":
                for (var n = 1; n <= 3; n++) {

                    var data = terms[n].split("/");

                    var vi = Number(data[0]);
                    //var j = Number(data[1]);
                    var ni = Number(data[2]);

                    vertex_indices.push(vi);
                    //texcoords.push(texcoords, texcoords_tmp[i]);
                    normal_indices.push(ni);
                }
                break;
        }
    }

    for (var i = 0; i <= vertex_indices.length; i++) {
        var vertexIndex = vertex_indices[i] - 1;
        var vertex = vertices_tmp[vertexIndex];
        vertex_out.push.apply(vertex_out, vertex);
    }

    for (var i = 0; i <= normal_indices.length; i++) {
        var normalIndex = normal_indices[i] - 1;
        var normal = normals_tmp[normalIndex];
        normal_out.push.apply(normal_out, normal);
    }

    obj.vertex_indices = vertex_indices;

    obj.vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_out), gl.STATIC_DRAW);

    obj.normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal_out), gl.STATIC_DRAW);

    //obj.texcoord_buffer = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, obj.texcoord_buffer);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
}

function loadImage(src) {
    return new Promise(function (resolve) {
        var img = new Image();
        img.onload = () => {
            resolve(img);
        }
        img.src = src;
    });
}

function radians(deg) {
    return deg * Math.PI / 180.0;
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

class Camera {
    constructor(pos, fov, lookat, up) {
        this.pos = pos || [0, 0, 0];
        this.lookat = lookat || [0, 0, -1];
        this.up = up || [0, 1, 0];
        this.fov = fov || 60;

        this.near = 0.1;
        this.far = 500;

        this.view_matrix = [];
        this.proj_matrix = [];

        var canvas = document.getElementById('my_Canvas');

        mat4.lookAt(this.view_matrix, this.pos, this.lookat, this.up);
        mat4.perspective(this.proj_matrix, radians(110), canvas.width / canvas.height, this.near, this.far);
    }

    rotate(yaw, pitch) {

        this.lookat[0] = Math.cos(radians(yaw)) * Math.cos(radians(pitch));
        this.lookat[1] = Math.sin(radians(pitch));
        this.lookat[2] = Math.sin(radians(yaw)) * Math.cos(radians(pitch));
    }

    zoom(val) {
        this.fov = val;
    }

    sendUniforms(shader) {

        vec3.add(this.lookat, this.lookat, this.pos);

        mat4.perspective(this.proj_matrix, this.fov * Math.PI / 180, canvas.width / canvas.height, this.near, this.far);
        mat4.lookAt(this.view_matrix, this.pos, this.lookat, this.up);

        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "proj_matrix"), false, this.proj_matrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "view_matrix"), false, this.view_matrix);
    }
}

class ObjectInstanced3D {
    constructor(objfile) {

        this.style = gl.TRIANGLES;

        this.model_matrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];

        this.color = [1, 1, 1];

        this.vertex_indices = [];
        this.instanceCount = 0;

        loadOBJ(this, objfile)

        this.offsets = [];

        this.offset_buffer = gl.createBuffer();

    }

    addInstance(offset_matrix) {
        this.offsets.push.apply(this.offsets, offset_matrix);
    }

    clearInstances() {
        this.offsets.length = 0;
    }

    render(shader) {
        // TODO break this up into smaller functions
        gl.useProgram(shader);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "model_matrix"), false, this.model_matrix);
        gl.uniform3fv(gl.getUniformLocation(shader, "model_color"), this.color);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        var _position = gl.getAttribLocation(shader, "position");
        gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(_position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        var _normal = gl.getAttribLocation(shader, "normal");
        gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(_normal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.offset_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.offsets), gl.STATIC_DRAW);
        var offsetLocation = gl.getAttribLocation(shader, "offset");
        var offsetLocation1 = offsetLocation + 1;
        var offsetLocation2 = offsetLocation + 2;
        var offsetLocation3 = offsetLocation + 3;

        var floatsPerRow = 4
        var bytesPerRow = floatsPerRow * 4;
        var bytesPerMatrix = bytesPerRow * 4;

        gl.vertexAttribPointer(offsetLocation, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, 0);
        gl.enableVertexAttribArray(offsetLocation);

        gl.vertexAttribPointer(offsetLocation1, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, (1 * bytesPerRow));
        gl.enableVertexAttribArray(offsetLocation1);

        gl.vertexAttribPointer(offsetLocation2, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, (2 * bytesPerRow));
        gl.enableVertexAttribArray(offsetLocation2);

        gl.vertexAttribPointer(offsetLocation3, floatsPerRow, gl.FLOAT, false, bytesPerMatrix, (3 * bytesPerRow));
        gl.enableVertexAttribArray(offsetLocation3);

        gl.vertexAttribDivisor(offsetLocation, 1);
        gl.vertexAttribDivisor(offsetLocation1, 1);
        gl.vertexAttribDivisor(offsetLocation2, 1);
        gl.vertexAttribDivisor(offsetLocation3, 1);

        gl.drawArraysInstanced(this.style, 0, this.vertex_indices.length, this.offsets.length / 16);

        gl.vertexAttribDivisor(offsetLocation, 0);
        gl.vertexAttribDivisor(offsetLocation1, 0);
        gl.vertexAttribDivisor(offsetLocation2, 0);
        gl.vertexAttribDivisor(offsetLocation3, 0);
    }
}

class LightDir {
    constructor(pos, color, luminacity, ambient, diffuse, specular, shadows, toggle) {
        this.pos = pos || [10, 200, 10];
        this.color = color || [1, 1, 1];
        this.luminacity = luminacity || 1;
        this.ambient = ambient || 0.2;
        this.diffuse = diffuse || 1;
        this.specular = specular || 1;
        this.shadows = shadows || true;
        this.toggle = toggle || true;

        this.view_matrix = [];
        this.proj_matrix = [];

        this.depthShader = null;
        this.depthMapFBO = null;
        this.depthMap = null
        this.SHADOW_WIDTH = 4096;
        this.SHADOW_HEIGHT = 4096;
    }

    enableShadows() {
        // TODO : break up into smaller functions
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
        mat4.ortho(this.proj_matrix, -50, 50, -50, 50, -50, 600);
        mat4.lookAt(this.view_matrix, this.pos, [0, 0, 0], [0, 1, 0]);

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
        gl.uniform1f(gl.getUniformLocation(shader, "light_luminacity"), this.luminacity);
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

class Skybox {

    constructor(faces) {

        this.vertex_indices = [        
            -1.0,  1.0, -1.0,
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
            -1.0,  1.0, -1.0,

            -1.0, -1.0,  1.0,
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            -1.0, -1.0,  1.0,

             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,

            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0
        ];

        this.vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_indices), gl.STATIC_DRAW);

        this.cubemapTexture = this.loadCubeMap(faces);
        
        this.shader = compileShader("vs_skybox", "fs_skybox");
    }

    loadCubeMap(faces) {

        const textureID = gl.createTexture();

        var promises = [];
        for (var i = 0; i < faces.length; i++) {
            promises.push(loadImage(faces[i]));
        }

        Promise.all(promises)
            .then(function (images) {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureID);

                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

                images.forEach((img, i) => {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, img.width, img.height, 0, gl.RGB, gl.UNSIGNED_BYTE, img);
                });
            });
        return textureID;
    }

    render(proj_matrix, view_matrix) {

        gl.depthFunc(gl.LEQUAL); 

        gl.useProgram(this.shader);

        gl.uniformMatrix4fv(gl.getUniformLocation(this.shader, "proj_matrix"), false, proj_matrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shader, "view_matrix"), false, view_matrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        var _position = gl.getAttribLocation(this.shader, "position");
        gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(_position);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubemapTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        gl.depthFunc(gl.LESS);

    }
}

export { Camera, ObjectInstanced3D, LightDir, compileShader, Skybox }
