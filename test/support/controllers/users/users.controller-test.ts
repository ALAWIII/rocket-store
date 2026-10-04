import { AffectedDeletedResponseDto } from 'src/modules/shared/dto/affected-deleted-response.dto';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';
import { UpdateUserTestDto } from 'test/support/types/user/update-user.dto.type';
import { UserTestDto } from 'test/support/types/user/user.dto.type';
import { attachBodyFields } from 'test/support/utils/attach-body-fields.util';
import { parseResponseBody, statusCodesListNormalize } from 'test/support/utils/parse-response-body.util';
import { UploadImage, UploadImageOptions } from 'test/support/utils/upload-random-image.util';

type FindUsersFilterTest = {
  name?: string;

  email?: string;

  roleId?: string;

  phone?: string;

  page?: number;

  limit?: number;
};

export class UsersControllerTest {
  readonly urlPrefix = '/api/v1/users';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): UsersControllerTest {
    return new UsersControllerTest(agent);
  }
  async findMe(statusCode?: ExpectedTestStatusCode) {
    const expectedStatusCode = statusCode ?? {
      code: 200,
      parseBody: true,
    };
    const response = await this.agent.get('/api/v1/users/me').expect(expectedStatusCode.code);
    const body = parseResponseBody<UserResponseDto>(response, statusCodesListNormalize(expectedStatusCode));
    return { response, body };
  }
  async findAll(statusCode: ExpectedTestStatusCode, query: FindUsersFilterTest = {}) {
    const response = await this.agent.get('/api/v1/users').query(query).expect(statusCode.code);
    const body = parseResponseBody<{ users: UserTestDto[]; total: number }>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async findById(userId: string, statusCode?: ExpectedTestStatusCode) {
    const expectedStatusCode = statusCode ?? {
      code: 200,
      parseBody: true,
    };
    const response = await this.agent.get(`/api/v1/users/${userId}`).expect(expectedStatusCode.code);
    const body = parseResponseBody<UserResponseDto>(response, statusCodesListNormalize(expectedStatusCode));
    return { response, body };
  }
  async updateMe(updateData: UpdateUserTestDto, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.patch(`/api/v1/users/me`).send(updateData).expect(statusCode.code);
    const body = parseResponseBody<UserTestDto>(response, statusCodesListNormalize(statusCode));
    return { response, body };
  }
  async assignRole(userId: string, roleId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.patch(`/api/v1/users/${userId}/role`).send({ roleId }).expect(statusCode.code);
    const body = parseResponseBody<UserTestDto>(response, statusCodesListNormalize(statusCode));
    return { response, body };
  }
  async reassignUsersRole(roles: { oldRoleId: string; newRoleId: string }, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.patch(`/api/v1/users/roles/reassign`).send(roles).expect(statusCode.code);
    const body = parseResponseBody<{ affected: number }>(response, statusCodesListNormalize(statusCode));
    return { response, body };
  }

  async updateProfileImage(options?: UploadImageOptions) {
    const { fileBuffer, finfo, statusCodes, nameWithExt } = await UploadImage.prepare({
      expectedStatus: { code: 200, parseBody: true },
      ...options,
    });
    const response = await attachBodyFields(
      this.agent.put(`${this.urlPrefix}/me/profile-image`).attach('file', fileBuffer, nameWithExt),
      finfo,
    ).expect(statusCodes.code);

    const body = parseResponseBody<ImageResponseDto>(response, statusCodesListNormalize(statusCodes));
    return { response, body };
  }
  async deleteProfileImage(statusCodes?: ExpectedTestStatusCode) {
    const expectedStatus = statusCodes ?? { code: 200, parseBody: true };

    const response = await this.agent.delete(`${this.urlPrefix}/me/profile-image`).expect(expectedStatus.code);

    const body = parseResponseBody<AffectedDeletedResponseDto>(response, statusCodesListNormalize(expectedStatus));
    return { response, body };
  }
}
