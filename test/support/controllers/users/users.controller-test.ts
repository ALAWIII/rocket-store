import { AffectedDeletedResponseDto } from 'src/modules/shared/dto/affected-deleted-response.dto';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { FindUsersFlatQueryDto } from 'src/modules/users/dto/find-users-by-filter.dto';
import { FindUsersResponseDto } from 'src/modules/users/dto/find-users-response.dto';
import { ReassignUsersRoleDto } from 'src/modules/users/dto/reassign-users-role.dto';
import { UpdateMeDto } from 'src/modules/users/dto/update-user.dto';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';
import { attachBodyFields } from 'test/support/utils/attach-body-fields.util';
import { parseResponseBody } from 'test/support/utils/parse-response-body.util';
import { UploadImage, UploadImageOptions } from 'test/support/utils/upload-random-image.util';

export class UsersControllerTest {
  readonly urlPrefix = '/api/v1/users';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): UsersControllerTest {
    return new UsersControllerTest(agent);
  }
  async findMe(statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get('/api/v1/users/me').expect(statusCode.code);
    const body = parseResponseBody<UserResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async findAll(statusCode: ExpectedTestStatusCode, query: FindUsersFlatQueryDto = {}) {
    const response = await this.agent.get('/api/v1/users').query(query).expect(statusCode.code);
    const body = parseResponseBody<FindUsersResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async findById(
    userId: string,
    statusCode: ExpectedTestStatusCode = {
      code: 200,
      parseBody: true,
    },
  ) {
    const response = await this.agent.get(`/api/v1/users/${userId}`).expect(statusCode.code);
    const body = parseResponseBody<UserResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async updateMe(updateData: UpdateMeDto, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.patch(`/api/v1/users/me`).send(updateData).expect(statusCode.code);
    const body = parseResponseBody<UserResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async assignRole(userId: string, roleId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.patch(`/api/v1/users/${userId}/role`).send({ roleId }).expect(statusCode.code);
    const body = parseResponseBody<UserResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async reassignUsersRole(roles: ReassignUsersRoleDto, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.patch(`/api/v1/users/roles/reassign`).send(roles).expect(statusCode.code);
    const body = parseResponseBody<AffectedDeletedResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }

  async updateProfileImage(options?: UploadImageOptions) {
    const {
      fileBuffer,
      finfo,
      statusCode: statusCode,
      nameWithExt,
    } = await UploadImage.prepare({
      expectedStatus: { code: 200, parseBody: true },
      ...options,
    });
    const response = await attachBodyFields(
      this.agent.put(`${this.urlPrefix}/me/profile-image`).attach('file', fileBuffer, nameWithExt),
      finfo,
    ).expect(statusCode.code);

    const body = parseResponseBody<ImageResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async deleteProfileImage(statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.delete(`${this.urlPrefix}/me/profile-image`).expect(statusCode.code);

    const body = parseResponseBody<AffectedDeletedResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
}
