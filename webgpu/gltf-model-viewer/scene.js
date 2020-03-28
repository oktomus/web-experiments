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

                // In the primitive attribute, we have a reference
                // to the position, normal, uv buffers (and more).
                const position_attribute = primitive.attributes.POSITION;
                const position_buffer_view = position_attribute.bufferView;
                primitive.positionBuffer = position_buffer_view;
                const position_gpu_buffer_usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
                if (position_buffer_view.buffer === null) {
                    const positions = new Float32Array(position_buffer_view.data);
                    this.create_buffer(position_buffer_view, position_gpu_buffer_usage, positions);
                }
                console.log("- Position buffer created.");

                // If not already done, create a buffer for the indices.
                const index_buffer_id = primitive.indices;
                const index_buffer_view = this.glTF.accessors[index_buffer_id].bufferView;
                primitive.indexBuffer = index_buffer_view;
                const index_gpu_buffer_usage = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
                if (index_buffer_view.buffer === null) {
                    // Place the indices in a 4-bytes aligned array (go from 16bit to 32 bit).
                    const original_indices = new Int16Array(index_buffer_view.data);
                    const indices = new Int32Array(original_indices);
                    index_buffer_view.byteLength = indices.byteLength;
                    this.create_buffer(index_buffer_view, index_gpu_buffer_usage, indices);
                }
                console.log("- Index buffer created.");
            });
        });

        console.log(`Linked GPU buffers to all mesh primitives.`);
    }

    /**
     * Create a GPU buffer for the given glTF buffer view.
     * @param {*} buffer_view
     * @param {*} usage See https://gpuweb.github.io/gpuweb/#buffer-usage
     */
    create_buffer(buffer_view, usage, data) {

        console.assert(buffer_view.buffer === null); // should not be initialized
        console.assert(data.byteLength % 4 == 0); // Must be 4 bytes aligned

        // Create the GPU buffer.
        buffer_view.buffer = this.gpuDevice.createBuffer({
            size: data.byteLength,
            usage
        });
        buffer_view.buffer.setSubData(0, data);
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
            draw_node(passEncoder, childNode);
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
        //passEncoder.setVertexBuffer(0, primitive.vertexArray);
        //passEncoder.draw(primitive.vertexCount, primitive.triangleCount, 0, 0);
                            //gl.drawArrays(primitive.mode, primitive.drawArraysOffset, primitive.drawArraysCount);
        passEncoder.setVertexBuffer(0, primitive.positionBuffer.buffer);
        passEncoder.setIndexBuffer(primitive.indexBuffer.buffer);
        passEncoder.drawIndexed(primitive.indicesLength, 1, 0, 0, 0);
    }
}
