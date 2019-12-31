import { getComputeContext } from './../js/compute-support.js';
import { getShaderProgram } from './../js/shader_loader.js';

async function run() {

    // Create context.
    const { context, canvas } = getComputeContext("compute-canvas");
    if (!context || !canvas) return;
    canvas.width = canvas.height = 500;

    // Compile shader.
    const rngProgram = await getShaderProgram(context, './glsl/rand.glsl');
    if (!rngProgram) return;

    // Define uniforms.
    const uniform_locations = {
        seed : context.getUniformLocation(rngProgram, "uSeed")
    };

    // Create the texture into which the frame will be rendered.
    const destTex = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, destTex);
    context.texStorage2D(context.TEXTURE_2D, 1, context.RGBA8, canvas.width, canvas.height);

    // Create a frameBuffer to be able to blit a texture into the canvas.
    const frameBuffer = context.createFramebuffer();
    context.bindFramebuffer(context.READ_FRAMEBUFFER, frameBuffer);
    context.framebufferTexture2D(context.READ_FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, destTex, 0);

    let SEED = 0;

    // Define the rendering process.
    let render = function() {

        // Attach.
        context.useProgram(rngProgram);

        // Prepare.
        context.bindImageTexture(0, destTex, 0, false, 0, context.WRITE_ONLY, context.RGBA8);
        context.useProgram(rngProgram);
        context.uniform1f(uniform_locations.seed, SEED);

        // Render.
        context.dispatchCompute(canvas.width / 16, canvas.height/ 16, 1);

        // Wait.
        context.memoryBarrier(context.TEXTURE_FETCH_BARRIER_BIT);

        // Show the frame.
        context.blitFramebuffer(
        0, 0, canvas.width, canvas.height,
        0, 0, canvas.width, canvas.height,
        context.COLOR_BUFFER_BIT, context.NEAREST);

        SEED += 1;
    }

    // Run it.
    let animationFrame = function() {
      render();

      window.requestAnimationFrame(animationFrame);
    }

    window.requestAnimationFrame(animationFrame);
};

run();