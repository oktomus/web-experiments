#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout (rgba8, binding = 0) readonly uniform highp image2D inputTex;
layout (rgba8, binding = 1) writeonly uniform highp image2D outputTex;

void main() {
    ivec2 storePos = ivec2(gl_GlobalInvocationID.xy);
    vec4 color = imageLoad(inputTex, storePos);
    imageStore(outputTex, storePos, color);
}