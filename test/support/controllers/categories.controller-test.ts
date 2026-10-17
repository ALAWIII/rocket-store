import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { CategoryResponseDto } from 'src/modules/categories/dto/category-response.dto';
import { parseResponseBody, statusCodesListNormalize } from '../utils/parse-response-body.util';
import { UpdateDetailsDto } from 'src/modules/categories/dto/update-details.dto';
import { MoveCategoryDto } from 'src/modules/categories/dto/move-category.dto';
import { AffectedDeletedResponseDto } from 'src/modules/shared/dto/affected-deleted-response.dto';
import { AttachImagesToCategoryDto } from 'src/modules/categories/dto/attach-images-to-category.dto';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { DetachImagesDto } from 'src/modules/shared/dto/detach-images.dto';
import { DetachImagesResponseDto } from 'src/modules/shared/dto/detach-images-response.dto';

export class CategoriesControllerTest {
  readonly urlPrefix = '/api/v1/categories';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): CategoriesControllerTest {
    return new CategoriesControllerTest(agent);
  }

  async create(category?: CreateCategoryDto, statusCodes?: ExpectedTestStatusCode) {
    const expectedStatus = statusCodes ?? { code: 201, parseBody: true };
    const response = await this.agent
      .post(this.urlPrefix)
      .send(category ?? { name: 'category', description: 'description' })
      .expect(expectedStatus.code);
    const body = parseResponseBody<CategoryResponseDto>(response, statusCodesListNormalize(expectedStatus));
    return { response, body };
  }
  async findById(id: string, statusCodes: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(`${this.urlPrefix}/${id}`).expect(statusCodes.code);
    const body = parseResponseBody<CategoryResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async findAll(statusCodes: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(this.urlPrefix).expect(statusCodes.code);
    const body = parseResponseBody<CategoryResponseDto[]>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async update(
    id: string,
    details: UpdateDetailsDto,
    statusCodes: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent.patch(`${this.urlPrefix}/${id}`).send(details).expect(statusCodes.code);
    const body = parseResponseBody<CategoryResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async move(
    id: string,
    data: MoveCategoryDto = { parentId: null },
    statusCodes: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/${id}`).send(data).expect(statusCodes.code);
    const body = parseResponseBody<CategoryResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async findSubtree(id: string, statusCodes: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(`${this.urlPrefix}/${id}/subtree`).expect(statusCodes.code);
    const body = parseResponseBody<CategoryResponseDto[]>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async remove(
    id: string,
    withSubtree: boolean = false,
    statusCodes: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent.delete(`${this.urlPrefix}/${id}`).query({ withSubtree }).expect(statusCodes.code);
    const body = parseResponseBody<AffectedDeletedResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async attachImages(
    id: string,
    data: AttachImagesToCategoryDto,
    statusCodes: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/${id}/images`).send(data).expect(statusCodes.code);
    const body = parseResponseBody<ImageResponseDto[]>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async detachImages(
    id: string,
    data: DetachImagesDto,
    statusCodes: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/${id}/images/detach`).send(data).expect(statusCodes.code);
    const body = parseResponseBody<DetachImagesResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async findBanners(id: string, statusCodes: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(`${this.urlPrefix}/${id}/images`).expect(statusCodes.code);
    const body = parseResponseBody<ImageResponseDto[]>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
}
