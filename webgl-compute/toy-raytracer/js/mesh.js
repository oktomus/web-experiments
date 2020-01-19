export class Mesh {
    constructor(name, vertices, indices) {
        this.name = name;
        this.vertices = vertices;
        this.indices = indices;
        this.triangle_count = indices.length / 3;
        this.vertice_count = vertices.length / 3;
        this.offset = undefined;
        this.diffuse_color = glm.vec3(0.4);
        this.emission = glm.vec3(0.0);
    }

    static get_padding()
    {
        // int offset; 4 bytes
        // int triangle_count; 4 bytes
        // 8 bytes padding
        // vec3 diffuse_color; 12 bytes
        // 4 bytes padding
        // vec3 emission; 12 bytes
        // 4 bytes padding
        // total : 48
        //
        // Rounded up to 16 byte padding
        // 
        // total : 48
        //
        // See why padding is required here:
        // https://twitter.com/9ballsyndrome/status/1178039885090848770
        // https://www.khronos.org/registry/OpenGL/specs/es/3.1/es_spec_3.1.pdf "7.6.2.2 Standard Uniform Block Layout" [1-10]
        
        return 48;
    }
}

export function create_meshes_buffer(meshes)
{
    const buffer = new ArrayBuffer(meshes.length * Mesh.get_padding());

    const int32Data = new Int32Array(buffer);
    const float32Data = new Float32Array(buffer);

    const four_bytes_padding = Mesh.get_padding() / 4;

    for (let index = 0; index < meshes.length; index++) {
        const element = meshes[index];

        int32Data[four_bytes_padding * index] = element.offset;
        int32Data[four_bytes_padding * index + 1] = element.triangle_count;
        // padding
        float32Data[four_bytes_padding * index + 4] = element.diffuse_color.x;
        float32Data[four_bytes_padding * index + 5] = element.diffuse_color.y;
        float32Data[four_bytes_padding * index + 6] = element.diffuse_color.z;
        // padding
        float32Data[four_bytes_padding * index + 8] = element.emission.x;
        float32Data[four_bytes_padding * index + 9] = element.emission.y;
        float32Data[four_bytes_padding * index + 10] = element.emission.z;
    }

    return buffer;
}