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

        this.create_vertex_arrays();
        this.link_buffer_to_primitives();
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
            `- ${this.glTF.images.length} image(s)\n` +
            `- ${this.glTF.materials.length} material(s)\n` +
            `- ${this.glTF.meshes.length} meshe(s)\n` +
            `- ${this.glTF.nodes.length} node(s)\n` +
            `- ${this.glTF.bufferViews.length} buffer view(s)\n` +
            `- ${this.glTF.textures.length} texture(s)\n`
            );
    }

    /**
     * Create buffers on the GPU.
     */
    create_vertex_arrays() {

        this.glTF.bufferViews.forEach(bufferView => {
            // console.log(bufferView);

            // Create the buffer.
            const [buffer, arrayBuffer] = this.gpuDevice.createBufferMapped({
                size: bufferView.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });

            // Fill it.
            new Float32Array(arrayBuffer).set(bufferView.data);

            // Prepare buffer for GPU operations.
            buffer.unmap();

            bufferView.buffer = buffer;
        });

        console.log(`Created ${this.glTF.bufferViews.length} vertex array(s).`);
    }

    /**
     * Ensure all primitive in the glTF scene
     * have a reference to the GPU buffer for
     * drawing.
     */
    link_buffer_to_primitives() {

        this.glTF.meshes.forEach(mesh => {
            mesh.primitives.forEach(primitive => {

                if (primitive.indicies === null) {
                    console.error(`Primitive not using indices are not supported`);
                    return;
                }

                // Create the buffer.
                const [vertexBuffer, vertexArray] = this.gpuDevice.createBufferMapped({
                    size: bufferView.byteLength,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                });




            });
        });

        console.log(`Linked GPU buffers to all mesh primitives.`);
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
        node.childrens.forEach(childNode => {
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
        console.log(primitive);

        passEncoder.setVertexBuffer(0, primitive.vertexArray);
        //passEncoder.draw(primitive.vertexCount, primitive.triangleCount, 0, 0);
                            //gl.drawArrays(primitive.mode, primitive.drawArraysOffset, primitive.drawArraysCount);
    }
}
