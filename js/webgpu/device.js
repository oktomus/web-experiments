import { checkWebGPUSupport } from "./support-alert.js";

export function getGpuDevice() {
    return checkWebGPUSupport()
        .then(gpu => gpu.requestAdapter())
        .then(adapter => adapter.requestDevice())
        .catch(e => console.error('Cannot access the GPU device.', e));
}