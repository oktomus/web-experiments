import { getGpuDevice } from "../../js/webgpu/device.js";
import glslangModule from "../../thirdparties/glslang.js";
import { getShaderSource } from "../../js/webgpu/shader_loader.js";
import { Texture } from "./texture.js";

// https://github.com/gpuweb/gpuweb
// https://austineng.github.io/webgpu-samples/#helloTriangle
// https://github.com/redcamel/webgpu

const shaderConfig = {
    fragPath: './shader.frag',
    vertPath: './shader.vert',
    positionAttributeLocation: 0,
    uvAttributeLocation: 1
};

const SizeOfFloat = 4;

const triangles = {
    stride: 6 * SizeOfFloat, // 6 floats (4 for position and 2 for uv)
    positionOffset: 0,
    uvOffset: 4 * 4,
    data: new Float32Array([
        // 4 first float : vertex
        // 2 next float : uv
        -1.0, 1.0, 0.0, 1.0,    0.0, 1.0,
        -1.0, -1.0, 0.0, 1.0,   0.0, 0.0,
        1.0, -1.0, 0.0, 1.0,    1.0, 0.0,
        1.0, 1.0, 0.0, 1.0,     1.0, 1.0
    ]),
    indices: new Int32Array([
        0, 1, 2,
        0, 2, 3
    ])
};

// float time;
const uniforms = {
    size: 1 * SizeOfFloat,
    time: new Float32Array(1)
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

    //=> Create a buffer for the triangles.
    const verticesBuffer = device.createBuffer({
        size: triangles.data.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    verticesBuffer.setSubData(0, triangles.data);

    //=> Create a buffer for the indices.
    const indexBuffer = device.createBuffer({
        size: triangles.indices.byteLength,
        usage: GPUBufferUsage.INDEX  | GPUBufferUsage.COPY_DST
    });
    indexBuffer.setSubData(0, triangles.indices);
    indexBuffer.indexCount = triangles.indices.length;

    //=> Load the texture.
    const texture = new Texture('./wall.jpg');
    await texture.create(device, GPUTextureUsage.SAMPLED);

	const textureSampler = device.createSampler({
		magFilter: "linear",
		minFilter: "linear",
		mipmapFilter: "linear",
		addressModeU : "clamp-to-edge",
		addressModeV : "clamp-to-edge",
		addressModeW : "clamp-to-edge"
	});

    //=> What is the layout of the uniforms (this includes textures).
    const uniformsBindGroupLayout = device.createBindGroupLayout({
        bindings: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                type: "uniform-buffer"
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                type: "sampler"
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                type: "sampled-texture"
            }
        ]
    });

    //=> Create a buffer for the uniforms.
    const uniformBuffer = device.createBuffer({
        size: uniforms.size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create a bind group used lated while rendering.
    const uniformBindGroup = device.createBindGroup({
        layout: uniformsBindGroupLayout,
        bindings: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                    offset: 0,
                    size: uniforms.size
                }
            },
            {
                binding: 1,
                resource: textureSampler,
            },
            {
                binding: 2,
                resource: texture.gpuTexture.createView(),
            }
        ]
    });

    // Create a render pipeline.
    const renderPipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [uniformsBindGroupLayout] }),
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
                arrayStride: triangles.stride,
                attributes: [
                    {
                        // position
                        shaderLocation: shaderConfig.positionAttributeLocation,
                        offset: triangles.positionOffset,
                        format: "float4"
                    },
                    {
                        // uv
                        shaderLocation: shaderConfig.uvAttributeLocation,
                        offset: triangles.uvOffset,
                        format: "float2"
                    },
                ]
            }]
        },
        rasterizationState: {
            cullMode: 'back',
        },
        colorStates: [{
            format: "bgra8unorm"
        }],
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

        // https://gpuweb.github.io/gpuweb/#dom-gpurenderencoderbase-drawindexed
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(renderPipeline);

        passEncoder.setBindGroup(0, uniformBindGroup);
        // Update time uniform.
        uniformBuffer.setSubData(0, uniforms.time);

        passEncoder.setVertexBuffer(0, verticesBuffer);
        passEncoder.setIndexBuffer(indexBuffer);
        passEncoder.drawIndexed(indexBuffer.indexCount, 1, 0, 0, 0);

        passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);
    }

    const startTime = performance.now();

    function loop() {

        uniforms.time[0] = performance.now() - startTime;

        // Render the frame.
        frame();

        // Ask for another frame.
        requestAnimationFrame(loop);
    }

    // Start the continuous render.
    loop();
}

init();
