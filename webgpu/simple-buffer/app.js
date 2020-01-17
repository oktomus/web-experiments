import { getGpuDevice } from "./../js/webgpu-device.js";

// What ?
// Use a buffer.
// https://gpuweb.github.io/gpuweb/#GPUBufferq

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
        console.log('buffer size', buffer.size);
        console.log('buffer usage', buffer.usage);
        console.log('buffer state', buffer.state);
        console.log('buffer mapping', buffer.mapping);
    });
