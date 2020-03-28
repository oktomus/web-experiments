import { getGpuDevice } from "../../js/webgpu/device.js";
import glslangModule from "../../thirdparties/glslang.js";
import { getShaderSource } from "../../js/webgpu/shader_loader.js";

// https://github.com/gpuweb/gpuweb
// https://austineng.github.io/webgpu-samples/#helloTriangle

const shaderConfig = {
    fragPath: './shader.frag',
    vertPath: './shader.vert',
};

async function init() {

    const device = await getGpuDevice();

    //=> Init canvas
    const canvas = document.getElementById('targetCanvas');

    let canvasSize = canvas.getBoundingClientRect();
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Obtain a drawing context.
    const context = canvas.getContext('gpupresent');

    const swapChain = context.configureSwapChain({
        device: device,
        format: "bgra8unorm"
    });

    //=> Compile shaders.
    const glslang = await glslangModule(); // Fetch the wasm glslang module.
    const fragSource = await getShaderSource(shaderConfig.fragPath);
    const vertSource = await getShaderSource(shaderConfig.vertPath);
    const frag = glslang.compileGLSL(fragSource, 'fragment');
    const vert = glslang.compileGLSL(vertSource, 'vertex');

    // Create a render pipeline.
    const renderPipeline = device.createRenderPipeline({
        vertexStage: {
            module: device.createShaderModule({
                code: vert,
                source: vertSource,
                transform: source => glslang.compileGLSL(source, 'vertex'),
            }),
            entryPoint: 'main'
        },
        fragmentStage: {
            module: device.createShaderModule({
                code: frag,
                source:fragSource,
                transform: source => glslang.compileGLSL(source, 'fragment'),
            }),
            entryPoint: 'main'
        },
        colorStates: [{
            format: "bgra8unorm"
        }],
        primitiveTopology: "triangle-list",
    });

    function frame() {
        const commandEncoder = device.createCommandEncoder();
        const textureView = swapChain.getCurrentTexture().createView();

        const renderPassDescriptor = {
            colorAttachments: [{
                attachment: textureView,
                loadValue: { r: 0.3, g: 0.2, b: 0.1, a: 1.0 },
            }],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(renderPipeline);
        passEncoder.draw(3, 1, 0, 0);
        passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);
    }

    function loop() {
        // Render the frame.
        frame();

        // Ask for another frame.
        requestAnimationFrame(loop);
    }

    // Start the continuous render.
    loop();
}

init();
