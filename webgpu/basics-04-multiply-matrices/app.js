import { getGpuDevice } from "../js/webgpu-device.js";
import glslangModule from 'https://unpkg.com/@webgpu/glslang@0.0.8/dist/web-devel/glslang.js';
import { getShaderSource } from "../js/shader_loader.js";

// https://gpuweb.github.io/gpuweb/#GPUBufferq
// https://github.com/gpuweb/gpuweb
// https://developers.google.com/web/updates/2019/08/get-started-with-gpu-compute-on-the-web

async function go() {

    const device = await getGpuDevice();

    // Create matrices.
    // Each matrix size is stored at the begining of the array.
    const firstMatrix = new Float32Array([
        2, 4, // 2x4 matrix.
        1, 2, 3, 4,
        5, 6, 7, 8
    ]);
    const secondMatrix = new Float32Array([
        4, 2, // 4x2 matrix.
        1, 2,
        3, 4,
        5, 6,
        7, 8
    ]);
    
    console.log('First matrix:', firstMatrix);
    console.log('Second matrix:', secondMatrix);

    //=> Create a buffer for the first matrix.
    const [gpuBufferFirstMatrix, arrayBufferFirstMatrix] = device.createBufferMapped({
        size: firstMatrix.byteLength,
        usage: GPUBufferUsage.STORAGE
    });
    new Float32Array(arrayBufferFirstMatrix).set(firstMatrix); // Fill it.
    gpuBufferFirstMatrix.unmap(); // Prepare for copy.

    //=> Create a buffer for the second matrix.
    const [gpuBufferSecondMatrix, arrayBufferSecondMatrix] = device.createBufferMapped({
        size: secondMatrix.byteLength,
        usage: GPUBufferUsage.STORAGE
    });
    new Float32Array(arrayBufferSecondMatrix).set(secondMatrix); // Fill it.
    gpuBufferSecondMatrix.unmap(); // Prepare for copy.

    // Create a buffer for the result.
    // Size is 2 + firstMatrixWidth * secondMatrixHeight.
    //          \_ Because we store the matrix size in the matrix buffer itself (at the begining).
    const resultBufferSize = Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
    const resultBuffer = device.createBuffer({
        size: resultBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    // Create a layout to interface buffers in the shader.
    // https://gpuweb.github.io/gpuweb/#GPUDevice-createBindGroupLayout
    const bindGroupLayout = device.createBindGroupLayout({
        bindings: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                type: 'readonly-storage-buffer'
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                type: 'readonly-storage-buffer'
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                type: 'storage-buffer'
            }
        ]
    });

    // Reference buffer according to the layout.
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        bindings: [
            {
                binding: 0,
                resource: {
                    buffer: gpuBufferFirstMatrix
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: gpuBufferSecondMatrix
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: resultBuffer
                }
            },
        ]
    });

    // Compile the shader.
    // https://developers.google.com/web/updates/2019/08/get-started-with-gpu-compute-on-the-web#pipeline_setup
    const computeShaderSource = await getShaderSource('./shader.glsl'); // Fetch the source code in a big string.
    const glslang = await glslangModule(); // Fetch the wasm glslang module.
    const compiledShader = glslang.compileGLSL(computeShaderSource, 'compute');

    // https://gpuweb.github.io/gpuweb/#dom-gpudevice-createcomputepipeline
    const computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        computeStage: {
            module: device.createShaderModule({
                code: compiledShader
            }),
            entryPoint: 'main'
        }
    });

    // Create commands to copy the buffer, run the sader and fetch the result.
    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline); // Use our compute shader.
    passEncoder.setBindGroup(0, bindGroup); // Attach our buffers.
    passEncoder.dispatch(firstMatrix[0], secondMatrix[1]); // Run it. Note: one dimension array.
    passEncoder.endPass();

    // Get a GPU buffer for reading in an unmapped state.
    const gpuReadBuffer = device.createBuffer({
        size: resultBufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Encode commands for copying buffer to buffer.
    commandEncoder.copyBufferToBuffer(
        resultBuffer,       // source buffer 
        0,                  // source offset
        gpuReadBuffer,      // destination buffer
        0,                  // destination offset
        resultBufferSize    // size
    );

    // Submit commands.
    const commands = commandEncoder.finish();
    device.defaultQueue.submit([commands]);

    // Read result.
    const result = await gpuReadBuffer.mapReadAsync();
    console.log('Result after shader compute:', new Float32Array(result));
}

go();
