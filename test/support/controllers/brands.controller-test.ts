import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import {
  parseResponseBody,
  statusCodesListNormalize,
} from '../utils/parse-response-body.util';
import { BrandResponseDto } from 'src/modules/brands/dto/brand-response.dto';
import { RenameBrandDto } from 'src/modules/brands/dto/rename-brand.dto';
import { FindAllBrandsFilterDto } from 'src/modules/brands/dto/find-all-brands-filter.dto';
import { RemoveBrandsResponseDto } from 'src/modules/brands/dto/remove-brands-response.dto';
import { AttachImagesToBrandDto } from 'src/modules/brands/dto/attach-images-to-brand.dto';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';

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
  async findAll(
    payload: FindAllBrandsFilterDto,
    statusCodes?: ExpectedTestStatusCode,
  ) {
    const expectedStatus = statusCodes ?? { code: 200, parseBody: true };
    const response = await this.agent
      .get(this.urlPrefix)
      .query(payload)
      .expect(expectedStatus.code);
    const body = parseResponseBody<BrandResponseDto[]>(
      response,
      statusCodesListNormalize(expectedStatus),
    );
    return { response, body };
  }
  async rename(
    brandId: string,
    payload: RenameBrandDto,
    statusCodes?: ExpectedTestStatusCode,
  ) {
    const expectedStatus = statusCodes ?? { code: 200, parseBody: true };
    const response = await this.agent
      .patch(`${this.urlPrefix}/${brandId}`)
      .send(payload)
      .expect(expectedStatus.code);
    const body = parseResponseBody<BrandResponseDto>(
      response,
      statusCodesListNormalize(expectedStatus),
    );
    return { response, body };
  }
  async removeMany(brandIds: string[], statusCodes?: ExpectedTestStatusCode) {
    const expectedStatus = statusCodes ?? { code: 200, parseBody: true };
    const response = await this.agent
      .post(`${this.urlPrefix}/batch-delete`)
      .send({ brandIds })
      .expect(expectedStatus.code);
    const body = parseResponseBody<RemoveBrandsResponseDto>(
      response,
      statusCodesListNormalize(expectedStatus),
    );
    return { response, body };
  }
  async attachImages(
    brandId: string,
    imges: AttachImagesToBrandDto,
    statusCodes?: ExpectedTestStatusCode,
  ) {
    const expectedStatus = statusCodes ?? { code: 201, parseBody: true };
    const response = await this.agent
      .post(`${this.urlPrefix}/${brandId}/images`)
      .send(imges)
      .expect(expectedStatus.code);
    const body = parseResponseBody<ImageResponseDto[]>(
      response,
      statusCodesListNormalize(expectedStatus),
    );
    return { response, body };
  }
}
