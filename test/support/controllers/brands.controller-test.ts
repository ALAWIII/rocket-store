import { UserAgent } from '../helpers/app-test.helper';

export class BrandsControllerTest {
  readonly urlPrefix = '/api/v1/brands';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): BrandsControllerTest {
    return new BrandsControllerTest(agent);
  }
}
