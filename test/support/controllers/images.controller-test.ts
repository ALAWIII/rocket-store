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
}
