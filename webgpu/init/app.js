import { checkWebGPUSupport } from "./../js/webgpu-support-alert.js";

checkWebGPUSupport();

// What ?
// Try to access the GPU using WebGPU.
// https://gpuweb.github.io/gpuweb/#navigator-gpu

console.log('navigator GPU', navigator.gpu);