import { UserAgent } from '../helpers/app-test.helper';
import type { Response } from 'superagent';
import { parseResponseBody } from '../utils/parse-response-body.util';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
import { AffectedDeletedResponseDto } from 'src/modules/shared/dto/affected-deleted-response.dto';
import { RoleResponseDto } from 'src/modules/access-control/dto/role-response.dto';
import { PermissionDto } from 'src/modules/access-control/dto/permission.dto';
import { Permission } from 'src/modules/access-control/domain/permission';

type CreateRoleTestDto = {
  name: string;
  permissions: PermissionDto[] | Permission[];
  assignScope?: PermissionDto[] | Permission[];
  createScope?: PermissionDto[] | Permission[];
};

export class RolesControllerTest {
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): RolesControllerTest {
    return new RolesControllerTest(agent);
  }
  async reloadPolicies(statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.post(`/api/v1/roles/policies/reload`).expect(statusCode.code);
    const body = parseResponseBody<AffectedDeletedResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async create(role: CreateRoleTestDto, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.post(`/api/v1/roles`).send(role).expect(statusCode.code);
    const body = parseResponseBody<RoleResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async findAll(statusCode: ExpectedTestStatusCode, scope?: 'assignable' | 'creatable') {
    const query = scope ? `?scope=${scope}` : '';
    const response = await this.agent.get(`/api/v1/roles${query}`).expect(statusCode.code);
    const body = parseResponseBody<RoleResponseDto[]>(response, statusCode.parseBody);
    return { response, body };
  }
  async update(roleId: string, name: string, statusCode: ExpectedTestStatusCode) {
    const response: Response = await this.agent.put(`/api/v1/roles/${roleId}`).send({ name }).expect(statusCode.code);
    const body = parseResponseBody<RoleResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async remove(roleId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.delete(`/api/v1/roles/${roleId}`).expect(statusCode.code);
    const body = parseResponseBody<AffectedDeletedResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
}
