import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { CategoryResponseDto } from 'src/modules/categories/dto/category-response.dto';
import { parseResponseBody, statusCodesListNormalize } from '../utils/parse-response-body.util';
import { UpdateDetailsDto } from 'src/modules/categories/dto/update-details.dto';
import { MoveCategoryDto } from 'src/modules/categories/dto/move-category.dto';

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
}
