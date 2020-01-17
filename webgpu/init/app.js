import { checkWebGPUSupport } from "./../js/webgpu-support-alert.js";

// What ?
// Try to access the GPU using WebGPU.
// https://gpuweb.github.io/gpuweb/#navigator-gpu

checkWebGPUSupport()
    .then(gpu => { // Got a gpu https://gpuweb.github.io/gpuweb/#gpu-interface
        console.log('navigator GPU', gpu);

        // Get the adapter.
        return gpu.requestAdapter();
    })
    .then(adapter => {  // Got a gpu adapter https://gpuweb.github.io/gpuweb/#gpu-adapter
        console.log('adapter', adapter);

        // Get access to the device.
        return adapter.requestDevice();
    })
    .then(device => {  // Got a gpu device https://gpuweb.github.io/gpuweb/#gpudevice
        console.log('device', device);
    });

