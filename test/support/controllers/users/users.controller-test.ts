import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';

export class UsersControllerTest {
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): UsersControllerTest {
    return new UsersControllerTest(agent);
  }
  findMe(statusCode: ExpectedTestStatusCode) {}
  findAll() {}
  findById() {}
  updateMe() {}
  assignRole() {}
  reassignUsersRole() {}
}
