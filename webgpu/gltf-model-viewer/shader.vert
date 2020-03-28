#version 450

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

layout(location = 0) out vec3 inNormal;

void main() {
    inNormal = normal;

    gl_Position = vec4(position, 1.0);
}
