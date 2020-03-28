import glslangModule from "../../thirdparties/glslang.js";
import { glTFLoader } from "../../thirdparties/minimal-gltf-loader.js";
import { getGpuDevice } from "../../js/webgpu/device.js";
import { getShaderSource } from "../../js/webgpu/shader_loader.js";
import { Scene } from "./scene.js";

// https://github.com/gpuweb/gpuweb
// https://austineng.github.io/webgpu-samples/#helloTriangle
// https://github.com/toji/gl-matrix

// https://github.com/shrekshao/minimal-gltf-loader
const gltfLoader = new glTFLoader();

const shaderConfig = {
    fragPath: './shader.frag',
    vertPath: './shader.vert',
    positionAttributeLocation: 0
};

const SizeOfFloat = 4;

const config = {
    vertexShaderLayoutSize: 3 * SizeOfFloat,
    positionOffset: 0,
    positionFormat: "float3"
};

const glTFDropdown = document.getElementById("gltf-model");

async function init() {
    const device = await getGpuDevice();

    //=> Init canvas
    const canvas = document.getElementById('targetCanvas');
    let canvasSize = canvas.getBoundingClientRect();
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height

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
        primitiveTopology: "triangle-list",
        vertexState: {
            vertexBuffers: [{
                arrayStride: config.vertexShaderLayoutSize,
                attributes: [{
                    // position
                    shaderLocation: shaderConfig.positionAttributeLocation,
                    offset: config.positionOffset,
                    format: config.positionFormat,
                }]
            }]
        },
        rasterizationState: {
            cullMode: 'back',
        },
        colorStates: [{
            format: "bgra8unorm"
        }],
    });

    let scenes = [];

    // Load the model choosen in the dropdown.
    function loadSelectedGLTFModel() {
        gltfLoader.loadGLTF(
            glTFDropdown.value,
            glTF => {
                scenes = [];
                const newScene = new Scene(glTF, device);
                scenes.push(newScene);
            }
        );
    }
    glTFDropdown.addEventListener("change", loadSelectedGLTFModel);
    loadSelectedGLTFModel(); // initial load when opening the page

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

        // Draw the scene.
        scenes.forEach(scene => {
            scene.draw(passEncoder);
        })

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
