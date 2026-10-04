import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { parseResponseBody, statusCodesListNormalize } from '../utils/parse-response-body.util';
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
    const { fileBuffer, finfo, statusCodes, nameWithExt } = await UploadImage.prepare(options);
    const response = await attachBodyFields(
      this.agent.post(this.urlPrefix).attach('file', fileBuffer, nameWithExt),
      finfo,
    ).expect(statusCodes.code);

    const body = parseResponseBody<ImageResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async findById(imgId: string, statusCodes: ExpectedTestStatusCode) {
    const response = await this.agent.get(`${this.urlPrefix}/${imgId}`).expect(statusCodes.code);
    const body = parseResponseBody<ImageResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async removeImages(
    imageIds: string[],
    statusCodes: ExpectedTestStatusCode,
    existsFn?: (id: string) => Promise<boolean>,
  ) {
    const response = await this.agent
      .post(`${this.urlPrefix}/batch-delete`)
      .send({ imageIds })
      .expect(statusCodes.code);
    const body = parseResponseBody<RemoveImagesResponseDto>(response, statusCodesListNormalize(statusCodes));
    if (existsFn) await waitStorageForAllDeletions(imageIds, existsFn);
    return { response, body };
  }
  async findUnused(payload: FindUnusedImagesDto, statusCodes?: ExpectedTestStatusCode) {
    const expectedStatus = statusCodes ?? { code: 200, parseBody: true };
    const response = await this.agent.get(`${this.urlPrefix}/unused`).query(payload).expect(expectedStatus.code);
    const body = parseResponseBody<FindUnusedImagesResponseDto>(response, statusCodesListNormalize(expectedStatus));
    return { response, body };
  }
  async removeUnused(statusCodes?: ExpectedTestStatusCode) {
    const expectedStatus = statusCodes ?? { code: 200, parseBody: true };
    const response = await this.agent.delete(`${this.urlPrefix}/unused`).expect(expectedStatus.code);
    const body = parseResponseBody<RemoveImagesResponseDto>(response, statusCodesListNormalize(expectedStatus));
    return { response, body };
  }
}
