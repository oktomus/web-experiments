#version 450

//
// Layout
//

layout(std430, set = 0, binding = 0) readonly buffer Input {
    float numbers[];
} inputArray;

layout(std430, set = 0, binding = 1) buffer Output {
    float numbers[];
} resultArray;

//
// Main
//

void main() {
    uint index = gl_GlobalInvocationID.x;

    float result = 0.0;

    // Value at index is index + all the previous values in the array.
    for (int i = 0; i <= index; i++) {
        result += inputArray.numbers[i];
    }

    resultArray.numbers[index] = result;
}
