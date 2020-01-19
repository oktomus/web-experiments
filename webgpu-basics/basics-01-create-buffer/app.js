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

    //=> Create a buffer and fill it from the CPU.
    const [gpuBuffer, arrayBuffer] = device.createBufferMapped({
        size: 4,
        usage: GPUBufferUsage.MAP_WRITE // Ask for a mapped state so that CPU can write in it.
    });

    // Write bytes to buffer.
    new Uint8Array(arrayBuffer).set([0, 1, 2, 3]);

    console.log(gpuBuffer, arrayBuffer);

    // Destroy it.
    gpuBuffer.destroy();
}

go();
