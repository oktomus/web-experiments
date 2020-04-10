#version 450

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

layout(location = 0) out vec3 inNormal;

layout(set=0, binding=0) uniform Uniforms {
    mat4 mvp;
} uniforms;

void main() {
    inNormal = normal;

    gl_Position = uniforms.mvp * vec4(position, 1.0);
}
