#version 450

layout(location = 0) in vec3 inNormal;

layout(location = 0) out vec4 outColor;

void main() {
    outColor = vec4(inNormal * 0.5 + 0.5, 1.0);
}
