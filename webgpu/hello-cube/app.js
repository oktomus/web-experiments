import { getGpuDevice } from "../js/webgpu-device.js";
import glslangModule from 'https://unpkg.com/@webgpu/glslang@0.0.8/dist/web-devel/glslang.js';
import { getShaderSource } from "../js/shader_loader.js";

// https://github.com/gpuweb/gpuweb
// https://github.com/gpuweb/gpuweb/blob/master/samples/hello-cube.html

// Data used.
// A Cube.
const cube = {
    vertexSize: 4 * 8,
    colorOffset: 4 * 8,
    data: new Float32Array([
        // float4 position, float4 color
        1, -1, 1, 1, 1, 0, 1, 1,
        -1, -1, 1, 1, 0, 0, 1, 1,
        -1, -1, -1, 1, 0, 0, 0, 1,
        1, -1, -1, 1, 1, 0, 0, 1,
        1, -1, 1, 1, 1, 0, 1, 1,
        -1, -1, -1, 1, 0, 0, 0, 1,

        1, 1, 1, 1, 1, 1, 1, 1,
        1, -1, 1, 1, 1, 0, 1, 1,
        1, -1, -1, 1, 1, 0, 0, 1,
        1, 1, -1, 1, 1, 1, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, -1, -1, 1, 1, 0, 0, 1,

        -1, 1, 1, 1, 0, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, -1, 1, 1, 1, 0, 1,
        -1, 1, -1, 1, 0, 1, 0, 1,
        -1, 1, 1, 1, 0, 1, 1, 1,
        1, 1, -1, 1, 1, 1, 0, 1,

        -1, -1, 1, 1, 0, 0, 1, 1,
        -1, 1, 1, 1, 0, 1, 1, 1,
        -1, 1, -1, 1, 0, 1, 0, 1,
        -1, -1, -1, 1, 0, 0, 0, 1,
        -1, -1, 1, 1, 0, 0, 1, 1,
        -1, 1, -1, 1, 0, 1, 0, 1,

        1, 1, 1, 1, 1, 1, 1, 1,
        -1, 1, 1, 1, 0, 1, 1, 1,
        -1, -1, 1, 1, 0, 0, 1, 1,
        -1, -1, 1, 1, 0, 0, 1, 1,
        1, -1, 1, 1, 1, 0, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,

        1, -1, -1, 1, 1, 0, 0, 1,
        -1, -1, -1, 1, 0, 0, 0, 1,
        -1, 1, -1, 1, 0, 1, 0, 1,
        1, 1, -1, 1, 1, 1, 0, 1,
        1, -1, -1, 1, 1, 0, 0, 1,
        -1, 1, -1, 1, 0, 1, 0, 1,
    ])
};

async function init() {

    const device = await getGpuDevice();
    const canvas = document.getElementById('targetCanvas');

    let canvasSize = canvas.getBoundingClientRect();
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    //=> Create a projection matrix.
    const aspect = Math.abs(canvas.width / canvas.height);
    let projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);

    // Obtain a drawing context.
    const context = canvas.getContext('gpupresent');

    console.log('Context:', context);

    // https://gpuweb.github.io/gpuweb/#swapchain
    const swapChain = context.configureSwapChain({
        device: device,
        format: 'bgra8unorm' // A 32 bit format BGRA. https://gpuweb.github.io/gpuweb/#enumdef-gputextureformat
    });

    // Fill the cube GPU buffer.
    const [verticesGpuBuffer, verticesArrayBuffer] = device.createBufferMapped({
        size: cube.data.byteLength,
        usage: GPUBufferUsage.VERTEX
    });
    new Float32Array(verticesArrayBuffer).set(cube.data);
    verticesGpuBuffer.unmap();

    // Pipeline
    // https://gpuweb.github.io/gpuweb/#dom-gpudevice-createshadermodule
    // https://gpuweb.github.io/gpuweb/#shader-module-creation
    // https://gpuweb.github.io/gpuweb/#typedefdef-gpushadercode
    const glslang = await glslangModule(); // Fetch the wasm glslang module.
    const fragSource = await getShaderSource('./shader.frag');
    const vertSource = await getShaderSource('./shader.vert');
    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [
                device.createBindGroupLayout({
                    bindings: [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX,
                            type: "uniform-buffer"
                        }
                    ]
                })
            ]
        }),
        vertexStage: {
            module: device.createShaderModule({
                code: glslang.compileGLSL(vertSource, "vertex"),
                source: vertSource,
                transform: source => glslang.compileGLSL(source, "vertex"),
            }),
            entryPoint: "main"
        },
        fragmentStage: {
            module: device.createShaderModule({
                code: glslang.compileGLSL(fragSource, "fragment"),
                source:fragSource,
                transform: source => glslang.compileGLSL(source, "fragment"),
            }),
            entryPoint: "main"
        },
        primitiveTopology: "triangle-list",
        colorStates: [{
            format: "bgra8unorm",
            alphaBlend: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add"
            },
            colorBlend: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add"
            },
            writeMask: GPUColorWrite.ALL
        }],
        depthStencilState: {
            depthWriteEnabled: true,
            depthCompare: "less"
        },
        vertexInput: {
            vertexBuffers: [
                {
                    attributeSet: [
                        {
                            shaderLocation: 0,  // [[attribute(0)]]
                            offset: 0,
                            format: "float4"
                        },
                        {
                            shaderLocation: 1,
                            offset: cube.colorOffset,
                            format: "float4"
                        }
                    ],
                    stride: cube.vertexSize,
                    stepMode: "vertex"
                }
            ]
        }
    });

}

init();
