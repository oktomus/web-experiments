import { getGpuDevice } from "./../js/webgpu-device.js";

// What ?
// Use a buffer.
// https://gpuweb.github.io/gpuweb/#GPUBufferq
// https://github.com/gpuweb/gpuweb

getGpuDevice()
    .then(device => {
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

        const buffer = device.createBuffer({
            size: 1,
            usage: GPUBufferUsage.STORAGE
        });

        console.log('buffer', buffer);

        // Destroy it.
        buffer.destroy();
    });
