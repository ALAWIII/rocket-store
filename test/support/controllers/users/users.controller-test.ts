import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';
import { UserTestDto } from 'test/support/types/user/user.dto.type';
import {
  parseResponseBody,
  statusCodesListNormalize,
} from 'test/support/utils/parse-response-body.util';

type FindUsersFilterTest = {
  name?: string;

  email?: string;

  roleId?: string;

  phone?: string;

  page?: number;

  limit?: number;
};

export class UsersControllerTest {
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): UsersControllerTest {
    return new UsersControllerTest(agent);
  }
  async findMe(statusCode: ExpectedTestStatusCode) {
    const response = await this.agent
      .get('/api/v1/users/me')
      .expect(statusCode.code);
    const body = parseResponseBody<UserTestDto>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async findAll(
    statusCode: ExpectedTestStatusCode,
    query: FindUsersFilterTest = {},
  ) {
    const response = await this.agent
      .get('/api/v1/users')
      .query(query)
      .expect(statusCode.code);
    const body = parseResponseBody<{ users: UserTestDto[]; total: number }>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async findById(userId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent
      .get(`/api/v1/users/${userId}`)
      .expect(statusCode.code);
    const body = parseResponseBody<UserTestDto>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  updateMe(statusCode: ExpectedTestStatusCode) {}
  assignRole(statusCode: ExpectedTestStatusCode) {}
  reassignUsersRole(statusCode: ExpectedTestStatusCode) {}
}
