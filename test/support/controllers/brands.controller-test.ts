import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import {
  parseResponseBody,
  statusCodesListNormalize,
} from '../utils/parse-response-body.util';
import { BrandResponseDto } from 'src/modules/brands/dto/brand-response.dto';

export class BrandsControllerTest {
  readonly urlPrefix = '/api/v1/brands';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): BrandsControllerTest {
    return new BrandsControllerTest(agent);
  }
  async create(brand: CreateBrandDto, statusCodes?: ExpectedTestStatusCode) {
    const expectedStatus = statusCodes ?? { code: 201, parseBody: true };
    const response = await this.agent
      .post(this.urlPrefix)
      .send(brand)
      .expect(expectedStatus.code);
    const body = parseResponseBody<BrandResponseDto>(
      response,
      statusCodesListNormalize(expectedStatus),
    );
    return { response, body };
  }
  async findById(brandId: string, statusCodes?: ExpectedTestStatusCode) {
    const expectedStatus = statusCodes ?? { code: 200, parseBody: true };
    const response = await this.agent
      .get(`${this.urlPrefix}/${brandId}`)
      .expect(expectedStatus.code);
    const body = parseResponseBody<BrandResponseDto>(
      response,
      statusCodesListNormalize(expectedStatus),
    );
    return { response, body };
  }
}
