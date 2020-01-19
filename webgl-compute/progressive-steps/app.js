import { getComputeContext } from '../../js/webcompute/support.js';

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;

const script = async () => {
  const { context, canvas } = getComputeContext("compute-canvas");
  if (!context || !canvas) return;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // language=GLSL
  const computeShaderSource1 = `#version 310 es
  layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
  layout (rgba8, binding = 0) writeonly uniform highp image2D frameTex;
  layout (rgba8, binding = 1) readonly uniform highp image2D accumulatedTex;
  uniform vec2 point;

  void main() {
      ivec2 storePos = ivec2(gl_GlobalInvocationID.xy);
      float distance = length(vec2(gl_GlobalInvocationID.xy) - point);
      float value = distance < 50.0 && distance != 0.0 ? 100.0 / (distance * distance) : 0.0;
      vec4 frameColor = vec4(value, 0.0, 0.0, 1.0);
      vec4 previousColor = imageLoad(accumulatedTex, storePos);
      vec4 color = clamp(frameColor + previousColor * 0.9, 0.0, 1.0);
      imageStore(frameTex, storePos, color);
  }
  `;

  const computeShader1 = createShader(context, context.COMPUTE_SHADER, computeShaderSource1);
  const computeProgram1 = createProgram(context, computeShader1);
  const pointLocation = context.getUniformLocation(computeProgram1, 'point');

  // language=GLSL
  const computeShaderSource2 = `#version 310 es
  layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
  layout (rgba8, binding = 0) readonly uniform highp image2D frameTex;
  layout (rgba8, binding = 1) writeonly uniform highp image2D accumulatedTex;

  void main() {
      ivec2 storePos = ivec2(gl_GlobalInvocationID.xy);
      vec4 color = imageLoad(frameTex, storePos);
      color = clamp(color, 0.0, 1.0);
      imageStore(accumulatedTex, storePos, color);
  }
  `;

  const computeShader2 = createShader(context, context.COMPUTE_SHADER, computeShaderSource2);
  const computeProgram2 = createProgram(context, computeShader2);

  const frameTexture = context.createTexture();
  context.bindTexture(context.TEXTURE_2D, frameTexture);
  context.texStorage2D(context.TEXTURE_2D, 1, context.RGBA8, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.bindImageTexture(0, frameTexture, 0, false, 0, context.READ_WRITE, context.RGBA8);

  const accumulatedTexture = context.createTexture();
  context.bindTexture(context.TEXTURE_2D, accumulatedTexture);
  context.texStorage2D(context.TEXTURE_2D, 1, context.RGBA8, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.bindImageTexture(1, accumulatedTexture, 0, false, 0, context.READ_WRITE, context.RGBA8);

  const frameBuffer = context.createFramebuffer();
  context.bindFramebuffer(context.READ_FRAMEBUFFER, frameBuffer);
  context.framebufferTexture2D(context.READ_FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, accumulatedTexture, 0); 

  context.clearColor(0.0, 0.0, 0.0, 1.0);

  let mouseX = CANVAS_WIDTH * 0.5;
  let mouseY = CANVAS_HEIGHT * 0.5;
  canvas.addEventListener('mousemove', event => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = CANVAS_HEIGHT - (event.clientY - rect.top);
  });

  const render = () => {
    context.clear(context.COLOR_BUFFER_BIT);

    context.bindImageTexture(0, frameTexture, 0, false, 0, context.READ_WRITE, context.RGBA8);
    context.bindImageTexture(1, accumulatedTexture, 0, false, 0, context.READ_WRITE, context.RGBA8);

    context.useProgram(computeProgram1);
    context.uniform2f(pointLocation, mouseX, mouseY);
    context.dispatchCompute(CANVAS_WIDTH / 16, CANVAS_HEIGHT / 16, 1);
    context.memoryBarrier(context.SHADER_IMAGE_ACCESS_BARRIER_BIT);
    context.memoryBarrier(context.SHADER_STORAGE_BARRIER_BIT);

    context.useProgram(computeProgram2);
    context.dispatchCompute(CANVAS_WIDTH / 16, CANVAS_HEIGHT / 16, 1);
    context.memoryBarrier(context.SHADER_IMAGE_ACCESS_BARRIER_BIT);
    context.memoryBarrier(context.SHADER_STORAGE_BARRIER_BIT);

    context.framebufferTexture2D(context.READ_FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, accumulatedTexture, 0); 

    context.blitFramebuffer(
      0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
      0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
      context.COLOR_BUFFER_BIT, context.NEAREST);

    requestAnimationFrame(render);
  };

  render();
};

const createShader = (context, type, source) => {
  const shader = context.createShader(type);
  context.shaderSource(shader, source);
  context.compileShader(shader);
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    console.log(context.getShaderInfoLog(shader));
    return null;
  }
  return shader;
};

const createProgram = (context, shader1, shader2) => {
  const program = context.createProgram();
  context.attachShader(program, shader1);
  if (shader2) {
    context.attachShader(program, shader2);
  }
  context.linkProgram(program);
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    console.log(context.getProgramInfoLog(program));
    return null;
  }
  return program;
};

window.addEventListener('DOMContentLoaded', script);
