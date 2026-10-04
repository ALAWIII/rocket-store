import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { createRandomImage, ImageOptions } from './create-random-image.util';

export interface UploadImageOptions {
  name?: string;
  altText?: string;
  imgOpts?: ImageOptions;
  expectedStatus?: ExpectedTestStatusCode;
}
export type UploadImageTestProps = {
  fileBuffer: Buffer<ArrayBufferLike>;
  finfo: { name: string; altText: string };
  imgExt: 'png' | 'jpeg' | 'webp' | 'avif';
  nameWithExt: string;
  statusCodes: ExpectedTestStatusCode;
};
export class UploadImage {
  static async prepare(options: UploadImageOptions = {}): Promise<UploadImageTestProps> {
    const {
      name = `testImg`,
      altText = 'Random test image',
      expectedStatus = { code: 201, parseBody: true },
      imgOpts,
    } = options;

    const imgResult = await createRandomImage(imgOpts);
    return {
      fileBuffer: imgResult.imgBuffer,
      finfo: { name, altText },
      nameWithExt: `${name}.${imgResult.imgOptions.imgExt}`,
      imgExt: imgResult.imgOptions.imgExt,
      statusCodes: expectedStatus,
    };
  }
}
