import { getContext } from "../../js/webgl/context.js";
import { getVertFragShaderProgram } from "../../js/webgl/shader.js";

// https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/glBlendEquation.xhtml
// http://jcgt.org/published/0002/02/09/

const light_path_count = 10;

var vertices = [];
var vertex_count = light_path_count * 4;

let shader_program;
let vertex_buffer;

const z_min = 0.0;
const z_max = 1.0;

function randX() { return Math.random() * 2.0 - 1.0; }
function randY() { return Math.random() * 2.0 - 1.0; }
function randZ() { return Math.random() * (z_max - z_min) + z_min; }

function generateLightPathsData() {
    vertices = [];

    for (let i = 0; i < light_path_count; i++) {
        const x = randX();
        const y = randY();
        const z = randZ();

        vertices.push(x, y, z);

        const x2 = randX();
        const y2 = randY();
        const z2 = randZ();
        vertices.push(x2, y2, z2);
        vertices.push(x2, y2, z2);

        const x3 = randX();
        const y3 = randY();
        const z3 = randZ();
        vertices.push(x3, y3, z3);
    }

    console.log('vertices', vertices);
}

async function compileShaders(gl) {
    const program = await getVertFragShaderProgram(gl, './path.vert', './path.frag');
    shader_program = program;
}

function createBuffer(gl) {
    // Create an empty buffer object
    vertex_buffer = gl.createBuffer();

    // Bind appropriate array buffer to it
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Pass the vertex data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Unbind the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function draw(gl, width, height) {

    gl.useProgram(shader_program);

    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Get the attribute location
    var coord = gl.getAttribLocation(shader_program, "coordinates");

    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

    // Enable the attribute
    gl.enableVertexAttribArray(coord);

    /*============ Drawing the triangle =============*/

    // Clear the canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);

    // Enable the depth test
    gl.enable(gl.DEPTH_TEST);

    // Clear the color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the view port
    gl.viewport(0, 0, width, height);

    // Draw the triangle
    gl.drawArrays(gl.LINES, 0, vertex_count);

    // POINTS, LINE_STRIP, LINE_LOOP, LINES,
    // TRIANGLE_STRIP,TRIANGLE_FAN, TRIANGLES
}

async function init(context) {
    console.log('context', context);
    const canvas = context.canvas;
    const gl = context;

    let canvasSize = canvas.getBoundingClientRect();
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    generateLightPathsData();

    await compileShaders(gl);
    createBuffer(gl);

    draw(gl, canvas.width, canvas.height);
}

getContext('targetCanvas', 'webgl2').then(context => {
    init(context);
});