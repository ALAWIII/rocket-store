import { UserAgent } from "test/support/helpers/app-test.helper";

export class ProductsControllerTest {
  readonly urlPrefix = '/api/v1/categories';
  constructor(private readonly agent: UserAgent) { }
  withAgent(agent: UserAgent): ProductsControllerTest {
    return new ProductsControllerTest(agent);
  }
}
