export function checkWebGPUSupport() {

    const gpu = navigator.gpu;

    if (gpu)
    {
        document.getElementById("support").style.display = 'block';
        document.getElementById("no-support").style.display = 'none';

        return Promise.resolve(gpu);
    }
    else
    {
        document.getElementById("support").style.display = 'none';
        document.getElementById("no-support").style.display = 'block';

        return Promise.reject('WebGPU not available.');
    }
};