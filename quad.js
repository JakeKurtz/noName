function sierpinski(scale, offset, depth) {
    var offsets = [];

    if (depth == 0) {
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                for (var k = 0; k < 3; k++) {

                    if ((i - 1) % 3 == 0 && (j - 1) % 3 == 0) { continue }
                    if ((k - 1) % 3 == 0 && (j - 1) % 3 == 0) { continue }
                    if ((k - 1) % 3 == 0 && (i - 1) % 3 == 0) { continue }

                    offsets.push(
                        scale, 0, 0, 0,
                        0, scale, 0, 0,
                        0, 0, scale, 0,
                        i*2*scale + offset[0], j*2*scale + offset[1], k*2*scale + offset[2], 1);
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

                    offsets = offsets.concat(sierpinski(scale / 3.0, [i*2*scale + offset[0], j*2*scale + offset[1], k*2*scale + offset[2]], depth - 1))
                }
            }
        }
        return offsets
    }
}

/*============= Creating a canvas ======================*/
var canvas = document.getElementById('my_Canvas');
gl = canvas.getContext('webgl2');

/*========== Defining and storing the geometry ==========*/

var cubeVertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
    1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
    -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
    -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
];

var colors = [
    5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
    1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
];

var indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
];

var offsets = sierpinski(0.5, [0, 0, 0], 3);
var instanceCount = offsets.length / 16;

var Sx = 1, Sy = 1, Sz = 1;
var depth = 2;

console.log(offsets);

// Create and store data into vertex buffer
var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

// Create and store data into color buffer
var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

var offset_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, offset_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsets), gl.STATIC_DRAW);

// Create and store data into index buffer
var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


/*=================== SHADERS =================== */

var vertCode = document.getElementById("vertex-shader").text;;

var fragCode = document.getElementById("fragment-shader").text;;

var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

var shaderprogram = gl.createProgram();
gl.attachShader(shaderprogram, vertShader);
gl.attachShader(shaderprogram, fragShader);
gl.linkProgram(shaderprogram);

/*======== Associating attributes to vertex shader =====*/

gl.useProgram(shaderprogram);

var mat_p = gl.getUniformLocation(shaderprogram, "mat_p");
var mat_v = gl.getUniformLocation(shaderprogram, "mat_v");
var mat_m = gl.getUniformLocation(shaderprogram, "mat_m");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var _position = gl.getAttribLocation(shaderprogram, "position");
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 12, 0);
gl.enableVertexAttribArray(_position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
var _color = gl.getAttribLocation(shaderprogram, "color");
gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 12, 0);
gl.enableVertexAttribArray(_color);

gl.bindBuffer(gl.ARRAY_BUFFER, offset_buffer);
var offsetLocation = gl.getAttribLocation(shaderprogram, "offset");
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

var translations = [200];
var index = 0;
var offset = 0.1;
for (var y = -10; y < 10; y += 2)
{
    for (var x = -10; x < 10; x += 2)
    {
        translations.push(0.0, 0.0);
    }
}

/*==================== MATRIX ====================== */

function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * .5) * Math.PI / 180);//angle*.5
    return [
        0.5 / ang, 0, 0, 0,
        0, 0.5 * a / ang, 0, 0,
        0, 0, -(zMax + zMin) / (zMax - zMin), -1,
        0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
    ];
}

var proj_matrix = get_projection(40, canvas.width / canvas.height, 1, 100);
var mo_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

view_matrix[14] = view_matrix[14] - 6;

/*================= Mouse events ======================*/

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;

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
    if (!drag) return false;
    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width,
        dY = (e.pageY - old_y) * 2 * Math.PI / canvas.height;
    THETA += dX;
    PHI += dY;
    old_x = e.pageX, old_y = e.pageY;
    e.preventDefault();
};

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("mouseout", mouseUp, false);
canvas.addEventListener("mousemove", mouseMove, false);

/*=========================rotation================*/

function rotateX(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1] * c - m[2] * s;
    m[5] = m[5] * c - m[6] * s;
    m[9] = m[9] * c - m[10] * s;

    m[2] = m[2] * c + mv1 * s;
    m[6] = m[6] * c + mv5 * s;
    m[10] = m[10] * c + mv9 * s;
}

function rotateY(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c * m[0] + s * m[2];
    m[4] = c * m[4] + s * m[6];
    m[8] = c * m[8] + s * m[10];

    m[2] = c * m[2] - s * mv0;
    m[6] = c * m[6] - s * mv4;
    m[10] = c * m[10] - s * mv8;
}

/*=================== Drawing =================== */

var THETA = 0,
    PHI = 0;
var time_old = 0;

var animate = function (time) {
    var dt = time - time_old;

    if (!drag) {
        dX *= AMORTIZATION, dY *= AMORTIZATION;
        THETA += dX, PHI += dY;
    }

    //set model matrix to I4

    mo_matrix[0] = Sx, mo_matrix[1] = 0, mo_matrix[2] = 0,
        mo_matrix[3] = 0,

        mo_matrix[4] = 0, mo_matrix[5] = Sy, mo_matrix[6] = 0,
        mo_matrix[7] = 0,

        mo_matrix[8] = 0, mo_matrix[9] = 0, mo_matrix[10] = Sz,
        mo_matrix[11] = 0,

        mo_matrix[12] = 0, mo_matrix[13] = 0, mo_matrix[14] = 0,
        mo_matrix[15] = 1;

    rotateY(mo_matrix, THETA);
    rotateX(mo_matrix, PHI);

    time_old = time;
    gl.enable(gl.DEPTH_TEST);

    // gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(mat_p, false, proj_matrix);
    gl.uniformMatrix4fv(mat_v, false, view_matrix);
    gl.uniformMatrix4fv(mat_m, false, mo_matrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, instanceCount);
    window.requestAnimationFrame(animate);
}
animate(0);