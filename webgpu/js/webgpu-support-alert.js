export function checkWebGPUSupport() {

    const gpu = navigator.gpu;

    if (gpu)
    {
        document.getElementById("support").style.display = 'block';
        document.getElementById("no-support").style.display = 'none';

        return gpu;
    }
    else
    {
        document.getElementById("support").style.display = 'none';
        document.getElementById("no-support").style.display = 'block';

        console.error("WebGPU not avilable");

        return null;
    }
};