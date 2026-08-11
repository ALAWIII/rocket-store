import { UserAgent } from '../helpers/app-test.helper';
import { RoleTestDto } from '../types/role-dto.type';
import type { Response } from 'superagent';
import { parseResponseBody } from '../utils/parse-response-body.util';
type CreateRoleTestPayload = Omit<RoleTestDto, 'id'>;
type CreateRoleTestBody = { response: Response; body?: RoleTestDto };
export class RolesControllerTest {
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): RolesControllerTest {
    return new RolesControllerTest(agent);
  }
  async reloadPolicies(): Promise<{
    response: Response;
    body?: { attempt: number };
  }> {
    const response = await this.agent.post(`/api/v1/roles/policies/reload`);
    const body = parseResponseBody<{ attempt: number }>(response, 200);
    return { response, body };
  }
  async create(role: CreateRoleTestPayload): Promise<CreateRoleTestBody> {
    const response = await this.agent.post(`/api/v1/roles`).send(role);
    const body = parseResponseBody<RoleTestDto>(response, 201);
    return { response, body };
  }
  async findAll(
    scope?: 'assignable' | 'creatable',
  ): Promise<{ response: Response; body?: RoleTestDto[] }> {
    const query = scope ? `?scope=${scope}` : '';
    const response = await this.agent.get(`/api/v1/roles${query}`);
    const body = parseResponseBody<RoleTestDto[]>(response, 200);
    return { response, body };
  }
  async update(roleId: string, name: string): Promise<CreateRoleTestBody> {
    const response: Response = await this.agent
      .put(`/api/v1/roles/${roleId}`)
      .send({ name });
    const body = parseResponseBody<RoleTestDto>(response, 200);
    return { response, body };
  }
  async remove(roleId: string) {
    const response = await this.agent.delete(`/api/v1/roles/${roleId}`);
    const body = parseResponseBody<{ affected: number }>(response, 200);
    return { response, body };
  }
}
