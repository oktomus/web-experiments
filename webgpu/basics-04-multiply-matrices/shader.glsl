#version 450

//
// Layout
//

layout(std430, set = 0, binding = 0) readonly buffer FirstMatrix {
    vec2 size;
    float numbers[]; // row first
} firstMatrix;

layout(std430, set = 0, binding = 1) readonly buffer SecondMatrix {
    vec2 size;
    float numbers[]; // row first
} secondMatrix;

layout(std430, set = 0, binding = 2) buffer Output {
    vec2 size;
    float numbers[]; // row first
} resultMatrix;

//
// Main
//

void main() {
    ivec2 index = ivec2(gl_GlobalInvocationID.x, gl_GlobalInvocationID.y);

    resultMatrix.size = ivec2(firstMatrix.size.x, secondMatrix.size.y);

    float result = 0.0;

    // https://en.m.wikipedia.org/wiki/Matrix_multiplication
    for (int i = 0; i < firstMatrix.size.y; ++i) {
        int a = i + index.x * int(firstMatrix.size.y);
        int b = index.y + i * int(secondMatrix.size.y);
        result += firstMatrix.numbers[a] * secondMatrix.numbers[b];
    }

    uint flatIndex = index.y + index.x * uint(resultMatrix.size.y);
    resultMatrix.numbers[flatIndex] = result;
}
