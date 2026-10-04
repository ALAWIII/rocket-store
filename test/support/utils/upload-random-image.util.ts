import sharp from 'sharp';
import { ImagesControllerTest } from '../controllers/images.controller-test';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { Response } from 'supertest';

export interface RandomImageUploadOptions {
  // --- 1. Success Case Defaults ---
  width?: number;
  height?: number;
  imgExt?: 'png' | 'jpeg' | 'webp' | 'avif';
  /** name consist only of letters and numbers without extension */
  name?: string;
  altText?: string;

  /** Ultimate escape hatch for highly specific edge cases */
  customBuffer?: Buffer;
  exactSizeBytes?: number;
  // --- 3. Test Expectations ---
  /** Defaults to 201 Created. Override for failure assertions. */
  expectedStatus?: ExpectedTestStatusCode;
}

export async function uploadRandomImage(
  imageController: ImagesControllerTest,
  options: RandomImageUploadOptions = {},
): Promise<{ response: Response; body?: ImageResponseDto }> {
  const {
    width = 800,
    height = 600,
    imgExt = 'png',
    name = `testImg`,
    altText = 'Random test image',
    exactSizeBytes = 0,
    customBuffer,
    expectedStatus = { code: 201, parseBody: true },
  } = options;
  let imgBuffer: Buffer;
  const nameWithExt = `${name}.${imgExt}`;

  if (customBuffer) {
    imgBuffer = customBuffer;
  } else {
    imgBuffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
        },
      },
    })
      [imgExt]()
      .toBuffer();
  }
  const expandedBuf = Buffer.concat([imgBuffer, Buffer.alloc(Math.max(exactSizeBytes - imgBuffer.length, 0))]);
  // --- Execute Upload ---
  return imageController.upload(expandedBuf, { name: nameWithExt, altText }, expectedStatus);
}
