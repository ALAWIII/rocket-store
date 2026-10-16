import { UserAgent } from '../helpers/app-test.helper';

export class CategoriesControllerTest {
  readonly urlPrefix = '/api/v1/categories';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): CategoriesControllerTest {
    return new CategoriesControllerTest(agent);
  }
}
