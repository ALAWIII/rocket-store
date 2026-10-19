import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { parseResponseBody } from '../utils/parse-response-body.util';
import { RemoveImagesResponseDto } from 'src/modules/images/dto/remove-images-response.dto';
import { FindUnusedImagesDto } from 'src/modules/images/dto/find-unused-images-pagination.dto';
import { FindUnusedImagesResponseDto } from 'src/modules/images/dto/find-unused-images-response.dto';
import { waitStorageForAllDeletions } from '../utils/wait-storage-for-all-deletions.util';
import { attachBodyFields } from '../utils/attach-body-fields.util';
import { UploadImage, UploadImageOptions } from '../utils/upload-random-image.util';

export class ImagesControllerTest {
  readonly urlPrefix = '/api/v1/images';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): ImagesControllerTest {
    return new ImagesControllerTest(agent);
  }
  async upload(options?: UploadImageOptions) {
    const { fileBuffer, finfo, statusCode, nameWithExt } = await UploadImage.prepare(options);
    const response = await attachBodyFields(
      this.agent.post(this.urlPrefix).attach('file', fileBuffer, nameWithExt),
      finfo,
    ).expect(statusCode.code);

    const body = parseResponseBody<ImageResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async findById(imgId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.get(`${this.urlPrefix}/${imgId}`).expect(statusCode.code);
    const body = parseResponseBody<ImageResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async removeImages(
    imageIds: string[],
    statusCode: ExpectedTestStatusCode,
    existsFn?: (id: string) => Promise<boolean>,
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/batch-delete`).send({ imageIds }).expect(statusCode.code);
    const body = parseResponseBody<RemoveImagesResponseDto>(response, statusCode.parseBody);
    if (existsFn) await waitStorageForAllDeletions(imageIds, existsFn);
    return { response, body };
  }
  async findUnused(payload: FindUnusedImagesDto, statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(`${this.urlPrefix}/unused`).query(payload).expect(statusCode.code);
    const body = parseResponseBody<FindUnusedImagesResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async removeUnused(statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.delete(`${this.urlPrefix}/unused`).expect(statusCode.code);
    const body = parseResponseBody<RemoveImagesResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
}
