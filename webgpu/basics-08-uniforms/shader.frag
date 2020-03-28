#version 450

layout(location = 0) out vec4 outColor;

layout(set=0, binding=0) uniform Uniforms {
    float time;
} uniforms;

void main() {
    const float low_time = uniforms.time * 0.001;

    outColor = vec4(cos(low_time) * 0.5 + 0.5, sin(low_time) * 0.5 + 0.5, 0.5, 1.0);
}
