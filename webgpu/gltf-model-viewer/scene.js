export class Scene {

    /**
     * Create a wrapper for a glTF file that can be rendered.
     * @param {} glTF
     * @param {*} gpuDevice
     */
    constructor(glTF, gpuDevice) {
        this.glTF = glTF;
        this.gpuDevice = gpuDevice;
        this.defaultScene = glTF.scenes[glTF.defaultScene];

        this.print_glTF();

        this.create_gpu_buffers();
    }

    /**
     * Print informations about the linked glTF file.
     */
    print_glTF() {
        console.log(this.glTF);

        console.log(
            `glTF file \n` +
            `- Version ${this.glTF.version}\n` +
            `- Default scene name: ${this.defaultScene.name}\n` +
            `- ${this.glTF.scenes.length} scene(s)\n` +
            `- ${this.glTF.images?.length ?? 0} image(s)\n` +
            `- ${this.glTF.materials?.length ?? 0} material(s)\n` +
            `- ${this.glTF.meshes.length} meshe(s)\n` +
            `- ${this.glTF.nodes.length} node(s)\n` +
            `- ${this.glTF.bufferViews.length} buffer view(s)\n` +
            `- ${this.glTF.textures?.length ?? 0} texture(s)\n`
            );
    }

    /**
     * Ensure all primitive in the glTF scene
     * have a their buffers available on GPU.
     */
    create_gpu_buffers() {

        this.glTF.meshes.forEach(mesh => {
            console.log(`Creating GPU buffers for mesh ${name ?? "unamed"}...`);
            mesh.primitives.forEach(primitive => {

                if (primitive.indices === null) {
                    console.error(`Primitive not using indices are not supported`);
                    return;
                }

                // Create the index buffer.
                primitive.indexBuffer = this.create_primitive_index_buffer(primitive);
                console.log("- Index buffer created.");

                // Create vertex buffer.
                primitive.vertexBuffer = this.create_primitive_vertex_buffer(primitive);
                console.log("- Vertex buffer created.");

            });
        });

        console.log(`Linked GPU buffers to all mesh primitives.`);
    }

    create_primitive_index_buffer(primitive) {

        const index_buffer_id = primitive.indices;
        const index_accessor = this.glTF.accessors[index_buffer_id];
        const index_buffer_view = index_accessor.bufferView;

        // Place the indices in a 4-bytes aligned array (go from 16bit to 32 bit).
        const original_indices = new Int16Array(index_buffer_view.data);
        const indices = new Int32Array(original_indices);

        // Create the GPU buffer.
        const buffer = this.gpuDevice.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        });
        buffer.setSubData(0, indices);

        return buffer;
    }

    create_primitive_vertex_buffer(primitive) {

        const hasPosition = primitive.attributes.POSITION;
        const hasNormal = primitive.attributes.NORMAL;

        let vertexBufferData = null;

        if (hasPosition && hasNormal) {

            const positionData = new Float32Array(primitive.attributes.POSITION.bufferView.data);
            const normalData = new Float32Array(primitive.attributes.NORMAL.bufferView.data);

            vertexBufferData = combine_vec3_and_normals(positionData, normalData);
        }

        console.assert(vertexBufferData);

        // Create the vertex buffer.
        const vertexBuffer = this.gpuDevice.createBuffer({
            size: vertexBufferData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        vertexBuffer.setSubData(0, vertexBufferData);

        return vertexBuffer;
    }

    /**
     * Draw the complete scene.
     * @param {} passEncoder
     */
    draw(passEncoder)
    {
        // Draw all nodes.
        // We assume all nodes are in the current scene.
        // See https://github.com/shrekshao/minimal-gltf-loader/blob/master/examples/webgl2-renderer-old.html#L483
        this.glTF.nodes.forEach(node => {
            this.draw_node(passEncoder, node);
        });
    }

    /**
     * Draw the given node.
     * @param {*} passEncoder
     * @param {*} node
     */
    draw_node(passEncoder, node)
    {
        // Draw the mesh in the node.
        if (node.mesh) {

            node.mesh.primitives.forEach(primitive => {
                this.draw_primitive(passEncoder, node, node.mesh, primitive);
            });
        }

        // Draw childrens.
        node.children.forEach(childNode => {
            this.draw_node(passEncoder, childNode);
        });
    }

    /**
     * Draw the given primitive.
     * @param {} passEncoder
     * @param {*} node The node that contains the mesh
     * @param {*} mesh The mesh that contains the primitive to draw
     * @param {*} primitive
     */
    draw_primitive(passEncoder, node, mesh, primitive)
    {
        passEncoder.setVertexBuffer(0, primitive.vertexBuffer);
        passEncoder.setIndexBuffer(primitive.indexBuffer);
        passEncoder.drawIndexed(primitive.indicesLength, 1, 0, 0, 0);
    }
}

function combine_vec3_and_normals(position, normal) {

    const totalLength = position.length + normal.length;
    const resultingBuffer = new Float32Array(totalLength);

    // How much float per element in the final buffer ?
    // position : vec3
    // normal : vec3
    // 6

    // How much vec3/normal is there in the final buffer ?
    const elementCount = totalLength / 6;

    for (var i = 0; i < elementCount; i++) {

        const writeIndex = i * 6;
        const positionIndex = i * 3; // Positions are stored 3 by 3
        const normalIndex = i * 3; // Normals are stored 3 by 3

        resultingBuffer[writeIndex] = position[positionIndex];
        resultingBuffer[writeIndex + 1] = position[positionIndex + 1];
        resultingBuffer[writeIndex + 2] = position[positionIndex + 2];

        resultingBuffer[writeIndex + 3] = normal[normalIndex];
        resultingBuffer[writeIndex + 4] = normal[normalIndex + 1];
        resultingBuffer[writeIndex + 5] = normal[normalIndex + 2];
    }

    return resultingBuffer;
}
