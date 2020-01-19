import { getGpuDevice } from "../../js/webgpu/device.js";
import glslangModule from 'https://unpkg.com/@webgpu/glslang@0.0.8/dist/web-devel/glslang.js';
import { getShaderSource } from "../../js/webgpu/shader_loader.js";

// https://gpuweb.github.io/gpuweb/#GPUBufferq
// https://github.com/gpuweb/gpuweb
// https://developers.google.com/web/updates/2019/08/get-started-with-gpu-compute-on-the-web

async function go() {

    const device = await getGpuDevice();

    const data = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    console.log('Original data:', data);

    // Create a inital buffer that will be copied to the GPU.
    const [gpuBufferData, arrayBufferData] = device.createBufferMapped({
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE
    });

    // Fill the array buffer.
    const arrayBufferView = new Float32Array(arrayBufferData);
    arrayBufferView.set(data);

    // Prepare for copy.
    gpuBufferData.unmap();

    // Create a buffer for the result.
    const resultBufferSize = arrayBufferView.byteLength;
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
                    buffer: gpuBufferData
                }
            },
            {
                binding: 1,
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

    // https://gpuweb.github.io/gpuweb/#dom-gpudevice-createcomputepipeline
    const computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        computeStage: {
            module: device.createShaderModule({
                code: glslang.compileGLSL(computeShaderSource, 'compute')
            }),
            entryPoint: 'main'
        }
    });

    // Create commands to copy the buffer, run the sader and fetch the result.
    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline); // Use our compute shader.
    passEncoder.setBindGroup(0, bindGroup); // Attach our buffers.
    passEncoder.dispatch(arrayBufferView.length); // Run it. Note: one dimension array.
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
