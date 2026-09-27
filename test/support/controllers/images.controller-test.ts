import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import {
  parseResponseBody,
  statusCodesListNormalize,
} from '../utils/parse-response-body.util';
import { UploadFileInfoDto } from 'src/modules/images/dto/upload-file-info.dto';
import { Test } from 'supertest';

export class ImagesControllerTest {
  readonly urlPrefix = '/api/v1/images';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): ImagesControllerTest {
    return new ImagesControllerTest(agent);
  }
  async upload(
    file: Buffer,
    finfo: UploadFileInfoDto,
    statusCodes: ExpectedTestStatusCode,
  ) {
    const nameWithExt = finfo.name;
    const name = finfo.name.split('.')[0];
    const fileInfo = { name, altText: finfo.altText };
    const response = await fields(
      this.agent.post(this.urlPrefix).attach('file', file, nameWithExt),
      fileInfo,
    ).expect(statusCodes.code);

    const body = parseResponseBody<ImageResponseDto>(
      response,
      statusCodesListNormalize(statusCodes),
    );
    return { response, body };
  }
  async findById(imgId: string, statusCodes: ExpectedTestStatusCode) {
    const response = await this.agent
      .get(`${this.urlPrefix}/${imgId}`)
      .expect(statusCodes.code);
    const body = parseResponseBody<ImageResponseDto>(
      response,
      statusCodesListNormalize(statusCodes),
    );
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
