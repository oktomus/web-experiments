#version 450

layout(set = 0, binding = 0) uniform Uniforms {
    mat4 modelViewProjectionMatrix;
} uniforms;

layout(location = 0) in vec4 position;
layout(location = 1) in vec4 color;

layout(location = 0) out vec4 fragColor;

void main() {
    fragColor = color;
    gl_Position = uniforms.modelViewProjectionMatrix * position;
}