#version 450

layout(location = 0) in vec2 vUV;

layout(set=0, binding=0) uniform Uniforms {
    float time;
} uniforms;

layout(set=0, binding=1) uniform sampler uSampler;
layout(set=0, binding=2) uniform texture2D uTexture;

layout(location = 0) out vec4 outColor;

void main() {

    vec4 texture_color = texture(sampler2D(uTexture, uSampler), vUV);

    texture_color.r *= cos(uniforms.time * 0.00001) * 0.5 + 0.5;
    texture_color.g *= sin(uniforms.time * 0.002 + 0.2) * 0.5 + 0.5;
    texture_color.b *= sin(cos(uniforms.time * 0.0005 + 0.1)) * 0.5 + 0.5;

    outColor = texture_color;
}
