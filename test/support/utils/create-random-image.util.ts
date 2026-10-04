import sharp from 'sharp';

export interface ImageOptions {
  width?: number;
  height?: number;
  imgExt?: 'png' | 'jpeg' | 'webp' | 'avif';
  exactSizeBytes?: number;
  background?: { r: number; g: number; b: number };
  customBuffer?: Buffer;
}
export type ImageResult = {
  imgBuffer: Buffer;
  imgOptions: { width: number; height: number; imgExt: 'png' | 'jpeg' | 'webp' | 'avif'; exactSizeBytes: number };
};
export async function createRandomImage(options: ImageOptions = {}): Promise<ImageResult> {
  const { width = 800, height = 600, imgExt = 'png', exactSizeBytes = 0, customBuffer, background } = options;

  let imgBuffer: Buffer;

  if (customBuffer) {
    imgBuffer = customBuffer;
  } else {
    imgBuffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: background ?? {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
        },
      },
    })
      [imgExt]()
      .toBuffer();
  }

  if (exactSizeBytes && exactSizeBytes > imgBuffer.length) {
    imgBuffer = Buffer.concat([imgBuffer, Buffer.alloc(exactSizeBytes - imgBuffer.length)]);
  }

  return { imgBuffer, imgOptions: { width, height, imgExt, exactSizeBytes } };
}
