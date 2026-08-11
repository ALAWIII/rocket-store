import { UserAgent } from '../helpers/app-test.helper';
import { RoleTestDto } from '../types/role-dto.type';
import type { Response } from 'superagent';
import {
  parseResponseBody,
  statusCodesListNormalize,
} from '../utils/parse-response-body.util';
import { TestStatusCodes } from '../types/status-codes.type';

type CreateRoleTestPayload = Omit<RoleTestDto, 'id'>;
type CreateRoleTestBody = { response: Response; body?: RoleTestDto };

export class RolesControllerTest {
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): RolesControllerTest {
    return new RolesControllerTest(agent);
  }
  async reloadPolicies(statusCodes: TestStatusCodes): Promise<{
    response: Response;
    body?: { attempt: number };
  }> {
    const response = await this.agent
      .post(`/api/v1/roles/policies/reload`)
      .expect(statusCodes.expectedStatusCode);
    const body = parseResponseBody<{ attempt: number }>(
      response,
      statusCodesListNormalize(statusCodes.bodyParseStatusCode),
    );
    return { response, body };
  }
  async create(
    role: CreateRoleTestPayload,
    statusCodes: TestStatusCodes,
  ): Promise<CreateRoleTestBody> {
    const response = await this.agent
      .post(`/api/v1/roles`)
      .send(role)
      .expect(statusCodes.expectedStatusCode);
    const body = parseResponseBody<RoleTestDto>(
      response,
      statusCodesListNormalize(statusCodes.bodyParseStatusCode),
    );
    return { response, body };
  }
  async findAll(
    statusCodes: TestStatusCodes,
    scope?: 'assignable' | 'creatable',
  ): Promise<{ response: Response; body?: RoleTestDto[] }> {
    const query = scope ? `?scope=${scope}` : '';
    const response = await this.agent
      .get(`/api/v1/roles${query}`)
      .expect(statusCodes.expectedStatusCode);
    const body = parseResponseBody<RoleTestDto[]>(
      response,
      statusCodesListNormalize(statusCodes.bodyParseStatusCode),
    );
    return { response, body };
  }
  async update(
    roleId: string,
    name: string,
    statusCodes: TestStatusCodes,
  ): Promise<CreateRoleTestBody> {
    const response: Response = await this.agent
      .put(`/api/v1/roles/${roleId}`)
      .send({ name })
      .expect(statusCodes.expectedStatusCode);
    const body = parseResponseBody<RoleTestDto>(
      response,
      statusCodesListNormalize(statusCodes.bodyParseStatusCode),
    );
    return { response, body };
  }
  async remove(roleId: string, statusCodes: TestStatusCodes) {
    const response = await this.agent
      .delete(`/api/v1/roles/${roleId}`)
      .expect(statusCodes.expectedStatusCode);
    const body = parseResponseBody<{ affected: number }>(
      response,
      statusCodesListNormalize(statusCodes.bodyParseStatusCode),
    );
    return { response, body };
  }
}
