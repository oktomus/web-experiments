import { getGpuDevice } from "../../js/webgpu/device.js";

// https://gpuweb.github.io/gpuweb/#GPUBufferq
// https://github.com/gpuweb/gpuweb
// https://developers.google.com/web/updates/2019/08/get-started-with-gpu-compute-on-the-web

async function go() {

    const device = await getGpuDevice();
    console.log('device', device);

    // Available buffer descriptor usage flags.
    console.log('GPU Buffer usage flags',
        GPUBufferUsage.MAP_READ,
        GPUBufferUsage.MAP_WRITE,
        GPUBufferUsage.COPY_SRC,
        GPUBufferUsage.COPY_DST,
        GPUBufferUsage.INDEX,
        GPUBufferUsage.VERTEX,
        GPUBufferUsage.UNIFORM,
        GPUBufferUsage.STORAGE,
        GPUBufferUsage.INDIRECT);

    // Get a GPU buffer in a mapped state and an arrayBuffer for writing from the CPU.
    const [gpuWriteBuffer, arrayBuffer] = device.createBufferMapped({
        size: 4,
        usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
    });

    // Write bytes to buffer.
    new Uint8Array(arrayBuffer).set([0, 1, 2, 3]);

    console.log('Buffer that will be sent to the GPU:', arrayBuffer);

    // Unmap buffer so that it can be used later for copy.
    gpuWriteBuffer.unmap();

    // Get a GPU buffer for reading in an unmapped state.
    const gpuReadBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Encode commands for copying buffer to buffer.
    const copyEncoder = device.createCommandEncoder();

    copyEncoder.copyBufferToBuffer(
        gpuWriteBuffer, // source buffer 
        0,              // source offset
        gpuReadBuffer,  // destination buffer
        0,              // destination offset
        4               // size
    );

    // Submit copy commands.
    const copyCommands = copyEncoder.finish();
    device.defaultQueue.submit([copyCommands]);

    console.log('Added buffer copy command in queue.');

    // Read buffer.
    const copyArrayBuffer = await gpuReadBuffer.mapReadAsync();
    console.log('GPU buffer content:', new Uint8Array(copyArrayBuffer));
}

go();
