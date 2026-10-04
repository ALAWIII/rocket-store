import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { parseResponseBody, statusCodesListNormalize } from '../utils/parse-response-body.util';
import { UploadFileInfoDto } from 'src/modules/images/dto/upload-file-info.dto';
import { Test } from 'supertest';
import { RemoveImagesResponseDto } from 'src/modules/images/dto/remove-images-response.dto';
import { FindUnusedImagesDto } from 'src/modules/images/dto/find-unused-images-pagination.dto';
import { FindUnusedImagesResponseDto } from 'src/modules/images/dto/find-unused-images-response.dto';

export class ImagesControllerTest {
  readonly urlPrefix = '/api/v1/images';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): ImagesControllerTest {
    return new ImagesControllerTest(agent);
  }
  async upload(file: Buffer, finfo: UploadFileInfoDto, statusCodes: ExpectedTestStatusCode) {
    const nameWithExt = finfo.name;
    const name = finfo.name.split('.')[0];
    const fileInfo = { name, altText: finfo.altText };
    const response = await fields(this.agent.post(this.urlPrefix).attach('file', file, nameWithExt), fileInfo).expect(
      statusCodes.code,
    );

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
    if (existsFn) await waitForAllDeletions(imageIds, existsFn);
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
function fields<T extends object>(request: Test, data: T) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue; // skip
    request.field(key, value);
  }
  return request;
}

async function waitForAllDeletions(ids: string[], checkExistsFn: (id: string) => Promise<boolean>, intervalMs = 1000) {
  const pendingIds = new Set(ids);

  while (pendingIds.size > 0) {
    const checks = Array.from(pendingIds).map(async (id) => {
      try {
        const exists = await checkExistsFn(id);
        if (!exists) {
          pendingIds.delete(id); // Successfully deleted, remove from polling
        }
      } catch {
        // Ignore transient network errors, retry next second
      }
    });

    await Promise.all(checks);

    if (pendingIds.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}
