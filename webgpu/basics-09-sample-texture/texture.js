// Thanks to redcamel
// https://github.com/redcamel/webgpu/blob/067da8a2b38e3f0aa50d4baab0294c0ecf2707d4/test/index.js#L848
export class Texture {
    constructor(url) {
        this.url = url;
    }

    async create(device, usage) {

        this.img = document.createElement('img');
        this.img.src = this.url;

        await this.img.decode();

        this.width = this.img.width;
        this.height = this.img.height;

        const textureExtent = {
            width: this.width,
            height: this.height,
            depth: 1
        };

        this.gpuTexture = device.createTexture({
            dimension: '2d',
            format: 'rgba8unorm',
            arrayLayerCount: 1,
            mipLevelCount: 1,
            sampleCount: 1,
            size: textureExtent,
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED
        });

        this.copy_img_to_texture_buffer(device);

        console.log(`Texture create and ready to be binded on GPU.`);
    }

    copy_img_to_texture_buffer(device) {

        // Create a canvas and draw the image in it.
        // We then copy the canvas content to GPU.
        const imageCanvas = document.createElement('canvas');
        document.body.appendChild(imageCanvas)
        imageCanvas.width = this.width;
        imageCanvas.height = this.height;

        // Draw the image.
        const imageCanvasContext = imageCanvas.getContext('2d');
        imageCanvasContext.translate(0, this.height);
        imageCanvasContext.scale(1, -1);
        imageCanvasContext.drawImage(this.img, 0, 0, this.width, this.height);

        // Get a buffer containing the image (on CPU).
        const imageData = imageCanvasContext.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        const rowPitch = Math.ceil(this.width * 4 / 256) * 256;

        // Copy the texture to the GPU.
        const textureDataBuffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });
        textureDataBuffer.setSubData(0, data);

        const bufferView = {
            buffer: textureDataBuffer,
            rowPitch: rowPitch,
            imageHeight: this.height,
        };
        const textureView = {
            texture: this.gpuTexture,
            mipLevel: 0,
            arrayLayer: 0
        };
        const textureExtent = {
            width: this.width,
            height: this.height,
            depth: 1
        };

        const commandEncoder = device.createCommandEncoder({});

        // https://gpuweb.github.io/gpuweb/#dom-gpucommandencoder-copybuffertotexture
        commandEncoder.copyBufferToTexture(bufferView, textureView, textureExtent);
        device.defaultQueue.submit([commandEncoder.finish()]);

        textureDataBuffer.destroy()
        document.body.removeChild(imageCanvas);
    }
}
