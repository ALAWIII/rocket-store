import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { parseResponseBody } from '../utils/parse-response-body.util';
import { BrandResponseDto } from 'src/modules/brands/dto/brand-response.dto';
import { RenameBrandDto } from 'src/modules/brands/dto/rename-brand.dto';
import { FindAllBrandsFilterDto } from 'src/modules/brands/dto/find-all-brands-filter.dto';
import { RemoveBrandsResponseDto } from 'src/modules/brands/dto/remove-brands-response.dto';
import { AttachImagesToBrandDto } from 'src/modules/brands/dto/attach-images-to-brand.dto';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { DetachImagesResponseDto } from 'src/modules/shared/dto/detach-images-response.dto';

export class BrandsControllerTest {
  readonly urlPrefix = '/api/v1/brands';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): BrandsControllerTest {
    return new BrandsControllerTest(agent);
  }
  async create(brand: CreateBrandDto, statusCode: ExpectedTestStatusCode = { code: 201, parseBody: true }) {
    const response = await this.agent.post(this.urlPrefix).send(brand).expect(statusCode.code);
    const body = parseResponseBody<BrandResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async findById(brandId: string, statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(`${this.urlPrefix}/${brandId}`).expect(statusCode.code);
    const body = parseResponseBody<BrandResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async findAll(payload: FindAllBrandsFilterDto, statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(this.urlPrefix).query(payload).expect(statusCode.code);
    const body = parseResponseBody<BrandResponseDto[]>(response, statusCode.parseBody);
    return { response, body };
  }
  async rename(
    brandId: string,
    payload: RenameBrandDto,
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent.patch(`${this.urlPrefix}/${brandId}`).send(payload).expect(statusCode.code);
    const body = parseResponseBody<BrandResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async removeMany(brandIds: string[], statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.post(`${this.urlPrefix}/batch-delete`).send({ brandIds }).expect(statusCode.code);
    const body = parseResponseBody<RemoveBrandsResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async attachImages(
    brandId: string,
    images: AttachImagesToBrandDto['images'],
    statusCode: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent
      .post(`${this.urlPrefix}/${brandId}/images`)
      .send({ images })
      .expect(statusCode.code);
    const body = parseResponseBody<ImageResponseDto[]>(response, statusCode.parseBody);
    return { response, body };
  }
  async findBanners(brandId: string, statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(`${this.urlPrefix}/${brandId}/images`).expect(statusCode.code);
    const body = parseResponseBody<ImageResponseDto[]>(response, statusCode.parseBody);
    return { response, body };
  }
  async detachImages(
    brandId: string,
    imageIds: string[],
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent
      .post(`${this.urlPrefix}/${brandId}/images/detach`)
      .send({ imageIds })
      .expect(statusCode.code);
    const body = parseResponseBody<DetachImagesResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
}
