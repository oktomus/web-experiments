import { getGpuDevice } from "./../js/webgpu-device.js";

// https://developers.google.com/web/updates/2019/08/get-started-with-gpu-compute-on-the-web

async function go() {

    const device = await getGpuDevice();
    console.log('device', device);

    // Get a GPU buffer in a mapped state and an arrayBuffer for writing.
    const [gpuBuffer, arrayBuffer] = device.createBufferMapped({
        size: 4,
        usage: GPUBufferUsage.MAP_WRITE
    });

    console.log('GPU buffer', gpuBuffer);
    console.log('arrayBuffer', arrayBuffer);

    // Write bytes to buffer.
    new Uint8Array(arrayBuffer).set([0, 1, 2, 3]);
}

go();
