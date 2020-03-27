import { getGpuDevice } from "../../js/webgpu/device.js";
import glslangModule from 'https://unpkg.com/@webgpu/glslang@0.0.8/dist/web-devel/glslang.js';
import { getShaderSource } from "../../js/webgpu/shader_loader.js";
import { vec3, vec4, quat, mat4 } from "../../js/gl-matrix/index.js";
import { glTFLoader } from "../../js/minimal-gltf-loader.js";

// https://github.com/gpuweb/gpuweb
// https://austineng.github.io/webgpu-samples/#helloTriangle
// https://github.com/shrekshao/minimal-gltf-loader
// https://github.com/toji/gl-matrix

var gltfLoader = new glTFLoader();

gltfLoader.loadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf", function(glTF){
    console.log(glTF);
});
