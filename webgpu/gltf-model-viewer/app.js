import glslangModule from "../../thirdparties/glslang.js";
import { glTFLoader } from "../../thirdparties/minimal-gltf-loader.js";
import { getGpuDevice } from "../../js/webgpu/device.js";
import { getShaderSource } from "../../js/webgpu/shader_loader.js";
import { Scene } from "./scene.js";
import { mat4, vec3 } from "../../thirdparties/gl-matrix/index.js";

// https://github.com/gpuweb/gpuweb
// https://austineng.github.io/webgpu-samples/#helloTriangle
// https://github.com/toji/gl-matrix
// https://github.com/redcamel/webgpu

// https://github.com/shrekshao/minimal-gltf-loader
const gltfLoader = new glTFLoader();

const shaderConfig = {
    fragPath: './shader.frag',
    vertPath: './shader.vert',
    positionAttributeLocation: 0
};

const SizeOfFloat = 4;
let pauseRendering = true;

const config = {
    radius: 5.0,
    rotateTable: 0.0,
    swapChainFormat: "bgra8unorm",
    depthFromat: "depth24plus-stencil8",
    time: 0.0,
    vertexShaderBuffer: {
        arrayStride: 6 * SizeOfFloat,
        attributes: [
            {
                // position
                shaderLocation: 0,
                offset: 0,
                format: "float3",
            },
            {
                // normal
                shaderLocation: 1,
                offset: 3 * SizeOfFloat,
                format: "float3",
            },
        ]
    },
    uniforms: {
        size: 4 * 4 * SizeOfFloat, // mat4
    },
    mousedown: false
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
        format: config.swapChainFormat
    });

    //=> Compile shaders.
    const glslang = await glslangModule(); // Fetch the wasm glslang module.
    const fragSource = await getShaderSource(shaderConfig.fragPath);
    const vertSource = await getShaderSource(shaderConfig.vertPath);
    const frag = glslang.compileGLSL(fragSource, 'fragment');
    const vert = glslang.compileGLSL(vertSource, 'vertex');

    //=> Describe the uniforms layout.
    // (See the shaders).
    // https://gpuweb.github.io/gpuweb/#dom-gpudevice-createbindgrouplayout
    // https://gpuweb.github.io/gpuweb/#bind-group-layout-creation
    const uniformsBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                type: "uniform-buffer"
            }
        ]
    });

    //=> Create a buffer for the uniforms.
    const uniformBuffer = device.createBuffer({
        size: config.uniforms.size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    //=> Create a bind for the uniforms that will be used for rendering.
    // https://gpuweb.github.io/gpuweb/#dom-gpudevice-createbindgroup
	const uniformBindGroup = device.createBindGroup(
        {
            layout: uniformsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: uniformBuffer,
                        offset: 0,
                        size: config.uniforms.size
                    }
                }
            ]
        });

    // Create a render pipeline.
    const renderPipelineDescription = {
        layout: device.createPipelineLayout({bindGroupLayouts: [uniformsBindGroupLayout]}),
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
            indexFormat: 'uint32',
            vertexBuffers: [
                config.vertexShaderBuffer
            ]
        },
        rasterizationState: {
            cullMode: 'back',
        },
        colorStates: [{
            format: config.swapChainFormat,
            alphaBlend: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add"
            }
        }],
        depthStencilState: {
			depthWriteEnabled: true,
			depthCompare: "less",
			format: config.depthFromat,
		},
    };
    const renderPipeline = device.createRenderPipeline(renderPipelineDescription);

    // We need a texture for depth-test.
    const depthTexture = device.createTexture({
		size: {
			width: canvas.width,
			height: canvas.height,
			depth: 1
		},
		format: config.depthFromat,
		usage: GPUTextureUsage.OUTPUT_ATTACHMENT
	});

    let scenes = [];

    // Load the model choosen in the dropdown.
    function loadSelectedGLTFModel() {
        pauseRendering = true;

        gltfLoader.loadGLTF(
            glTFDropdown.value,
            glTF => {
                scenes = [];
                const newScene = new Scene(glTF, device);
                scenes.push(newScene);

                pauseRendering = false;
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
            depthStencilAttachment: {
				attachment: depthTexture.createView(),
				depthLoadValue: 1.0,
				depthStoreOp: "store",
				stencilLoadValue: 0,
				stencilStoreOp: "store",
			}
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(renderPipeline);

        passEncoder.setBindGroup(0, uniformBindGroup);

        // Let's make a camera matrix !
        // By copying some code online...
        let perspective = mat4.create();
        let aspect = Math.abs(canvas.width / canvas.height);
        mat4.perspective(perspective, (2 * Math.PI) / 5, aspect, 0.1, 100);

        const radius = config.radius;
        const camX = Math.sin(config.rotateTable) * radius;
        const camZ = Math.cos(config.rotateTable) * radius;
        let view = mat4.create();
        view = mat4.lookAt(
            view,
            vec3.fromValues(camX, 0.0, camZ),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 1.0, 0.0));

        const mvp = mat4.create();
        mat4.mul(mvp, perspective, view);

        uniformBuffer.setSubData(0, mvp);

        // Draw the scene.
        scenes.forEach(scene => {
            scene.draw(passEncoder);
        })

        passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);
    }

    function loop() {

        const laps = performance.now() - config.time;
        config.time += laps;

        if (!config.mousedown)
            config.rotateTable += laps * 0.001;

        // Render the frame.
        if (!pauseRendering)
            frame();

        // Ask for another frame.
        requestAnimationFrame(loop);
    }

    // User interactions.
    canvas.addEventListener('wheel', function(event){
        config.radius += event.deltaY * 0.001;
        return false;
    }, false);
    canvas.addEventListener('mousedown', function(event){
        config.mousedown = true;
    }, false);
    canvas.addEventListener('mouseup', function(event){
        config.mousedown = false;
    }, false);

    // Start the continuous render.
    loop();
}

init();
