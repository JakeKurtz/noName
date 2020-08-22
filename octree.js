import { ObjectInstanced3D } from './render.js'
import { glMatrix, mat4 } from './gl-matrix/src/index.js'

var canvas = document.getElementById('my_Canvas');
var gl = canvas.getContext('webgl2');

glMatrix.setMatrixArrayType(Array);

var LDB = 0;
var LDF = 1;
var LUB = 2;
var LUF = 3;
var RDB = 4;
var RDF = 5;
var RUB = 6;
var RUF = 7;

var L = 8;
var R = 9;
var D = 10;
var U = 11;
var B = 12;
var F = 13;

var LD = 14;
var LU = 15;
var LB = 16;
var LF = 17;
var RD = 18;
var RU = 19;
var RB = 20;
var RF = 21;
var DB = 22;
var DF = 23;
var UB = 24;
var UF = 25;


function adjacent_table(dir, oct) {
    switch (dir) {
        case L:
            switch (oct) {
                case LDB:
                    return true;
                case LDF:
                    return true;
                case LUB:
                    return true;
                case LUF:
                    return true;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case R:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return true;
                case RDF:
                    return true;
                case RUB:
                    return true;
                case RUF:
                    return true;
            }
        case D:
            switch (oct) {
                case LDB:
                    return true;
                case LDF:
                    return true;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return true;
                case RDF:
                    return true;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case U:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return true;
                case LUF:
                    return true;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return true;
                case RUF:
                    return true;

            }
        case B:
            switch (oct) {
                case LDB:
                    return true;
                case LDF:
                    return false;
                case LUB:
                    return true;
                case LUF:
                    return false;
                case RDB:
                    return true;
                case RDF:
                    return false;
                case RUB:
                    return true;
                case RUF:
                    return false;
            }
        case F:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return true;
                case LUB:
                    return false;
                case LUF:
                    return true;
                case RDB:
                    return false;
                case RDF:
                    return true;
                case RUB:
                    return false;
                case RUF:
                    return true;
            }
        case LD:
            switch (oct) {
                case LDB:
                    return true;
                case LDF:
                    return true;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case LU:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return true;
                case LUF:
                    return true;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case LB:
            switch (oct) {
                case LDB:
                    return true;
                case LDF:
                    return false;
                case LUB:
                    return true;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case LF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return true;
                case LUB:
                    return false;
                case LUF:
                    return true;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case RD:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return true;
                case RDF:
                    return true;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case RU:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return true;
                case RUF:
                    return true;
            }
        case RB:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return true;
                case RDF:
                    return false;
                case RUB:
                    return true;
                case RUF:
                    return false;
            }
        case RF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return true;
                case RUB:
                    return false;
                case RUF:
                    return true;
            }
        case DB:
            switch (oct) {
                case LDB:
                    return true;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return true;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case DF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return true;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return true;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case UB:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return true;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return true;
                case RUF:
                    return false;
            }
        case UF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return true;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return true;
            }
        case LDB:
            switch (oct) {
                case LDB:
                    return true;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case LDF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return true;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case LUB:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return true;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case LUF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return true;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case RDB:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return true;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case RDF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return true;
                case RUB:
                    return false;
                case RUF:
                    return false;
            }
        case RUB:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return true;
                case RUF:
                    return false;
            }
        case RUF:
            switch (oct) {
                case LDB:
                    return false;
                case LDF:
                    return false;
                case LUB:
                    return false;
                case LUF:
                    return false;
                case RDB:
                    return false;
                case RDF:
                    return false;
                case RUB:
                    return false;
                case RUF:
                    return true;
            }
        default:
            return false;
    }
}
function reflect_table(dir, oct) {
    switch (dir) {
        case L:
            switch (oct) {
                case LDB:
                    return RDB;
                case LDF:
                    return RDF;
                case LUB:
                    return RUB;
                case LUF:
                    return RUF;
                case RDB:
                    return LDB;
                case RDF:
                    return LDF;
                case RUB:
                    return LUB;
                case RUF:
                    return LUF;
            }
        case R:
            switch (oct) {
                case LDB:
                    return RDB;
                case LDF:
                    return RDF;
                case LUB:
                    return RUB;
                case LUF:
                    return RUF;
                case RDB:
                    return
                case RDF:
                    return
                case RUB:
                    return
                case RUF:
                    return
            }
        case D:
            switch (oct) {
                case LDB:
                    return LUB;
                case LDF:
                    return LUF;
                case LUB:
                    return LDB;
                case LUF:
                    return LDF;
                case RDB:
                    return RUB;
                case RDF:
                    return RUF;
                case RUB:
                    return RDB;
                case RUF:
                    return RDF;
            }
        case U:
            switch (oct) {
                case LDB:
                    return LUB;
                case LDF:
                    return LUF;
                case LUB:
                    return LDB;
                case LUF:
                    return LDF;
                case RDB:
                    return RUB;
                case RDF:
                    return RUF;
                case RUB:
                    return RDB;
                case RUF:
                    return RDF;
            }
        case B:
            switch (oct) {
                case LDB:
                    return LDF;
                case LDF:
                    return LDB;
                case LUB:
                    return LUF;
                case LUF:
                    return LUB;
                case RDB:
                    return RDF;
                case RDF:
                    return RDB;
                case RUB:
                    return RUF;
                case RUF:
                    return RUB;
            }
        case F:
            switch (oct) {
                case LDB:
                    return LDF;
                case LDF:
                    return LDB;
                case LUB:
                    return LUF;
                case LUF:
                    return LUB;
                case RDB:
                    return RDF;
                case RDF:
                    return RDB;
                case RUB:
                    return RUF;
                case RUF:
                    return RUB;
            }
        case LD:
            switch (oct) {
                case LDB:
                    return RUB;
                case LDF:
                    return RUF;
                case LUB:
                    return RDB;
                case LUF:
                    return RDF;
                case RDB:
                    return LUB;
                case RDF:
                    return LUF;
                case RUB:
                    return LDB;
                case RUF:
                    return LDF;
            }
        case LU:
            switch (oct) {
                case LDB:
                    return RUB;
                case LDF:
                    return RUF;
                case LUB:
                    return RDB;
                case LUF:
                    return RDF;
                case RDB:
                    return LUB;
                case RDF:
                    return LUF;
                case RUB:
                    return LDB;
                case RUF:
                    return LDF;
            }
        case LB:
            switch (oct) {
                case LDB:
                    return RDF;
                case LDF:
                    return RDB;
                case LUB:
                    return RUF;
                case LUF:
                    return RUB;
                case RDB:
                    return LDF;
                case RDF:
                    return LDB;
                case RUB:
                    return LUF;
                case RUF:
                    return LUB;
            }
        case LF:
            switch (oct) {
                case LDB:
                    return RDF;
                case LDF:
                    return RDB;
                case LUB:
                    return RUF;
                case LUF:
                    return RUB;
                case RDB:
                    return LDF;
                case RDF:
                    return LDB;
                case RUB:
                    return LUF;
                case RUF:
                    return LUB;
            }
        case RD:
            switch (oct) {
                case LDB:
                    return RUB;
                case LDF:
                    return RUF;
                case LUB:
                    return RDB;
                case LUF:
                    return RDF;
                case RDB:
                    return LUB;
                case RDF:
                    return LUF;
                case RUB:
                    return LDB;
                case RUF:
                    return LDF
            }
        case RU:
            switch (oct) {
                case LDB:
                    return RUB;
                case LDF:
                    return RUF;
                case LUB:
                    return RDB;
                case LUF:
                    return RDF;
                case RDB:
                    return LUB;
                case RDF:
                    return LUF;
                case RUB:
                    return LDB;
                case RUF:
                    return LDF
            }
        case RB:
            switch (oct) {
                case LDB:
                    return RDF;
                case LDF:
                    return RDB;
                case LUB:
                    return RUF;
                case LUF:
                    return RUB;
                case RDB:
                    return LDF;
                case RDF:
                    return LDB;
                case RUB:
                    return LUF;
                case RUF:
                    return LUB;
            }
        case RF:
            switch (oct) {
                case LDB:
                    return RDF;
                case LDF:
                    return RDB;
                case LUB:
                    return RUF;
                case LUF:
                    return RUB;
                case RDB:
                    return LDF;
                case RDF:
                    return LDB;
                case RUB:
                    return LUF;
                case RUF:
                    return LUB;
            }
        case DB:
            switch (oct) {
                case LDB:
                    return LUF;
                case LDF:
                    return LUB;
                case LUB:
                    return LDF;
                case LUF:
                    return LDB;
                case RDB:
                    return RUF;
                case RDF:
                    return RUB;
                case RUB:
                    return RDF;
                case RUF:
                    return RDB;
            }
        case DF:
            switch (oct) {
                case LDB:
                    return LUF;
                case LDF:
                    return LUB;
                case LUB:
                    return LDF;
                case LUF:
                    return LDB;
                case RDB:
                    return RUF;
                case RDF:
                    return RUB;
                case RUB:
                    return RDF;
                case RUF:
                    return RDB;
            }
        case UB:
            switch (oct) {
                case LDB:
                    return LUF;
                case LDF:
                    return LUB;
                case LUB:
                    return LDF;
                case LUF:
                    return LDB;
                case RDB:
                    return RUF;
                case RDF:
                    return RUB;
                case RUB:
                    return RDF;
                case RUF:
                    return RDB;
            }
        case UF:
            switch (oct) {
                case LDB:
                    return LUF;
                case LDF:
                    return LUB;
                case LUB:
                    return LDF;
                case LUF:
                    return LDB;
                case RDB:
                    return RUF;
                case RDF:
                    return RUB;
                case RUB:
                    return RDF;
                case RUF:
                    return RDB;
            }
        case LDB:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
        case LDF:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
        case LUB:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
        case LUF:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
        case RDB:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
        case RDF:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
        case RUB:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
        case RUF:
            switch (oct) {
                case LDB:
                    return RUF;
                case LDF:
                    return RUB;
                case LUB:
                    return RDF;
                case LUF:
                    return RDB;
                case RDB:
                    return LUF;
                case RDF:
                    return LUB;
                case RUB:
                    return LDF;
                case RUF:
                    return LDB;
            }
    }
}
function commonFace_table(dir, oct) {
    switch (dir) {
        case LD:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return -1;
                case LUB:
                    return L;
                case LUF:
                    return L;
                case RDB:
                    return D;
                case RDF:
                    return D;
                case RUB:
                    return -1;
                case RUF:
                    return -1;
            }
        case LU:
            switch (oct) {
                case LDB:
                    return L;
                case LDF:
                    return L;
                case LUB:
                    return -1;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return -1;
                case RUB:
                    return U;
                case RUF:
                    return -1;
            }
        case LB:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return L;
                case LUB:
                    return -1;
                case LUF:
                    return L;
                case RDB:
                    return B;
                case RDF:
                    return -1;
                case RUB:
                    return B;
                case RUF:
                    return -1;
            }
        case LF:
            switch (oct) {
                case LDB:
                    return L;
                case LDF:
                    return -1;
                case LUB:
                    return L;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return F;
                case RUB:
                    return -1;
                case RUF:
                    return F;
            }
        case RD:
            switch (oct) {
                case LDB:
                    return D;
                case LDF:
                    return D;
                case LUB:
                    return -1;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return -1;
                case RUB:
                    return R;
                case RUF:
                    return R;
            }
        case RU:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return -1;
                case LUB:
                    return U;
                case LUF:
                    return U;
                case RDB:
                    return R;
                case RDF:
                    return R;
                case RUB:
                    return -1;
                case RUF:
                    return -1;
            }
        case RB:
            switch (oct) {
                case LDB:
                    return B;
                case LDF:
                    return -1;
                case LUB:
                    return B;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return R;
                case RUB:
                    return -1;
                case RUF:
                    return R;
            }
        case RF:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return F;
                case LUB:
                    return -1;
                case LUF:
                    return F;
                case RDB:
                    return R;
                case RDF:
                    return -1;
                case RUB:
                    return R;
                case RUF:
                    return -1;
            }
        case DB:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return D;
                case LUB:
                    return B;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return D;
                case RUB:
                    return B;
                case RUF:
                    return -1;
            }
        case DF:
            switch (oct) {
                case LDB:
                    return D;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return F;
                case RDB:
                    return D;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return F;
            }
        case UB:
            switch (oct) {
                case LDB:
                    return B;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return U;
                case RDB:
                    return B;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return U;
            }
        case UF:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return F;
                case LUB:
                    return U;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return F;
                case RUB:
                    return U;
                case RUF:
                    return -1;
            }
        case LDB:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return L;
                case RDB:
                    return -1;
                case RDF:
                    return D;
                case RUB:
                    return B;
                case RUF:
                    return -1;
            }
        case LDF:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return -1;
                case LUB:
                    return L;
                case LUF:
                    return -1;
                case RDB:
                    return D;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return F;
            }
        case LUB:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return L;
                case LUB:
                    return -1;
                case LUF:
                    return -1;
                case RDB:
                    return B;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return U;
            }
        case LUF:
            switch (oct) {
                case LDB:
                    return L;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return F;
                case RUB:
                    return U;
                case RUF:
                    return -1;
            }
        case RDB:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return D;
                case LUB:
                    return B;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return R;
            }
        case RDF:
            switch (oct) {
                case LDB:
                    return D;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return F;
                case RDB:
                    return -1;
                case RDF:
                    return -1;
                case RUB:
                    return R;
                case RUF:
                    return -1;
            }
        case RUB:
            switch (oct) {
                case LDB:
                    return B;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return U;
                case RDB:
                    return -1;
                case RDF:
                    return R;
                case RUB:
                    return -1;
                case RUF:
                    return -1;
            }
        case RUF:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return F;
                case LUB:
                    return U;
                case LUF:
                    return -1;
                case RDB:
                    return R;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return -1;
            }
    }
}
function commonEdge_table(dir, oct) {
    switch (dir) {
        case LDB:
            switch (oct) {
                case LDB:
                    return -1
                case LDF:
                    return LD;
                case LUB:
                    return LB;
                case LUF:
                    return -1;
                case RDB:
                    return DB;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return -1;
            }
        case LDF:
            switch (oct) {
                case LDB:
                    return LD;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return LF;
                case RDB:
                    return -1;
                case RDF:
                    return DF;
                case RUB:
                    return -1;
                case RUF:
                    return -1;
            }
        case LUB:
            switch (oct) {
                case LDB:
                    return LB;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return LU;
                case RDB:
                    return -1;
                case RDF:
                    return -1;
                case RUB:
                    return UB;
                case RUF:
                    return -1;
            }
        case LUF:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return LF;
                case LUB:
                    return LU;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return UF;
            }
        case RDB:
            switch (oct) {
                case LDB:
                    return DB;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return -1;
                case RDB:
                    return -1;
                case RDF:
                    return RD;
                case RUB:
                    return RB;
                case RUF:
                    return -1;
            }
        case RDF:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return DF;
                case LUB:
                    return -1;
                case LUF:
                    return -1;
                case RDB:
                    return RD;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return RF;
            }
        case RUB:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return -1;
                case LUB:
                    return UB;
                case LUF:
                    return -1;
                case RDB:
                    return RB;
                case RDF:
                    return -1;
                case RUB:
                    return -1;
                case RUF:
                    return RU;
            }
        case RUF:
            switch (oct) {
                case LDB:
                    return -1;
                case LDF:
                    return -1;
                case LUB:
                    return -1;
                case LUF:
                    return UF;
                case RDB:
                    return -1;
                case RDF:
                    return RF;
                case RUB:
                    return RU;
                case RUF:
                    return -1;
            }
    }
}

class Node {
    constructor(root, center, scale, octant) {
        this.root = root;
        this.octant = octant;
        this.scale = scale;
        this.children = [];
        this.center = center;
        this.leaf = false;
        this.objects = [];
    }
}

class Octree {
    constructor(points, maxDepth, center, scale, render) {

        this.points = points.slice();

        this.minPerBucket = true;
        this.maxDepth = maxDepth;
        this.center = center;
        this.scale = scale;
        this.render = render;

        this.root = new Node(null, this.center, this.scale, -1);
        this.root.objects = this.points;

        this.cube = new ObjectInstanced3D('cubeDebug.obj');
        this.cube.color = [0, 0, 0];
        this.cube.style = gl.LINE_LOOP;
    }

    // PUBLIC
    build() {
        this.build_rec(this.root, this.maxDepth);
    }

    // PRIVATE

    son(father, octant) {
        var child;
        for (child of father.children) {
            if (child.octant == octant) {
                return child;
            }
        }

        return null;
    }

    face_neighbour(node, dir) {
        var Q = null;
        // Find a common ancestor //
        if (node.root != null && adjacent_table(dir, node.octant)) {
            Q = this.face_neighbour(node.root, dir);
        } else {
            Q = node.root; 
        }
        // Follow the reflected path to locate the neighbour // 
        if (Q != null && Q.leaf == false) {
            return this.son(Q, reflect_table(dir, node.octant));
        } else {
            return Q;
        }
    }
    edge_neighbour(node, dir) {
        var Q = null;

        // Find common ancestor //
        if (node.root == null) {
            Q = null;
        } else if (adjacent_table(dir, node.octant)) {
            Q = this.edge_neighbour(node.root, dir);
        } else if (commonFace_table(dir, node.octant) != -1) {
            Q = this.face_neighbour(node.root, commonFace_table(dir, node.octant));
        } else {
            Q = node.root;
        }

        // Follow opposite path to locate neighbour //
        if (Q != null && Q.leaf == false) {
            return this.son(Q, reflect_table(dir, node.octant));
        } else {
            return Q;
        }
    }
    vertex_neighbour(node, dir) {
        var Q = null;

        // Find a common ancestor //
        if (node.root == null) {
            Q = null;
        } else if (adjacent_table(dir, node.octant)) {
            Q = this.vertex_neighbour(node.root, dir);
        } else if (commonEdge_table(dir, node.octant) != -1) {
            Q = this.edge_neighbour(node.root, commonEdge_table(dir, node.octant));
        } else if (commonFace_table(dir, node.octant) != -1) {
            Q = this.face_neighbour(node.root, commonFace_table(dir, node.octant));
        } else {
            Q = node.root;
        }

        // Follow opposite path to locat the neighbour //
        if (Q != null && Q.leaf == false) {
            return this.son(Q, reflect_table(dir, node.octant));
        } else {
            return Q;
        }
    }

    relocate

    getLocals(node) {

        var locals = [];

        var center = node.center;
        var scale = node.scale;

        var points = [];
        if (node.root == null) {
            var points = this.points;
        } else {
            var points = node.root.objects;
        }

        var x0 = center[0] + scale;
        var x1 = center[0] - scale;

        var y0 = center[1] + scale;
        var y1 = center[1] - scale;

        var z0 = center[2] + scale;
        var z1 = center[2] - scale;

        for (var i = 0; i < points.length; i++) {
            var p = points[i];

            if (p.pos[0] < x0 && p.pos[0] > x1 &&
                p.pos[1] < y0 && p.pos[1] > y1 &&
                p.pos[2] < z0 && p.pos[2] > z1) {

                p.node = node;
                locals.push(p);
            }
        }

        return locals;
    }
    add_visual(center, scale) {
        var mat = mat4.create();
        mat4.translate(mat, mat, center);
        mat4.scale(mat, mat, [scale, scale, scale]);
        this.cube.addInstance(mat);
    }
    build_rec(node, depth) {

        var locals = this.getLocals(node);

        if (locals.length == 0) {
            return
        }

        var center = node.center;
        var scale = node.scale;

        if (depth == 0 || locals.length == this.minPerBucket) {
            node.leaf = true;
            node.objects = locals;
            if (this.render) { this.add_visual(center, scale); }
            return
        }

        var _scale = scale / 2;
        var octant = 0
        for (var i = false; i < 2; i++) {
            for (var j = false; j < 2; j++) {
                for (var k = false; k < 2; k++) {

                    var x = i;
                    var y = j;
                    var z = k;

                    if (x == 0) { x = -true; }
                    if (y == 0) { y = -true; }
                    if (z == 0) { z = -true; }

                    var _center = [
                        center[0] + (x * scale / 2),
                        center[1] + (y * scale / 2),
                        center[2] + (z * scale / 2)];

                    var _node = new Node(node, _center, _scale, octant);
                    node.children.push(_node);
                    node.objects = locals;

                    this.build_rec(_node, depth - 1);

                    octant += 1;
                }
            }
        }
    }
}

export { Octree };