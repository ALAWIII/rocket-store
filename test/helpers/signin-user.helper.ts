import { Response, Test } from 'supertest';
import TestAgent from 'supertest/lib/agent';

type SigninUserPayload = {
  email: string;
  password: string;
};
export class SigninUserHelper {
  constructor(private readonly agent: TestAgent<Test>) {}

  async signin(payload: SigninUserPayload): Promise<Response> {
    return await this.agent
      .post('/api/auth/sign-in/email')
      .send({ ...payload, rememberMe: true })
      .expect(200);
  }
}
