import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { UserAgent } from '../helpers/app-test.helper';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { CategoryResponseDto } from 'src/modules/categories/dto/category-response.dto';
import { parseResponseBody, statusCodesListNormalize } from '../utils/parse-response-body.util';

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
}
