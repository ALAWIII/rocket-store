import { v7 } from 'uuid';
import { HttpClient } from './app-test.helper';
import { Response } from 'supertest';
import { MailhogClient } from 'mailhog-awesome';
import { Client } from 'pg';
import { plainToInstance } from 'class-transformer';
import { RoleDatabaseDto } from 'src/modules/access-control/infrastructure/dto/role-database-response.dto';
import { UserDatabaseDto } from 'src/modules/users/infrastructure/dto/user-database-response.dto';

type UserPayload = {
  name: string;
  email: string;
  password: string;
};

export type SignupResponseBody = {
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    roleId?: string;
    emailVerified: boolean;
    image: string | null;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
    givenName?: null | string; //the givenName, familyName and roleId fields appears when firing a request second time to signup endpoint.
    familyName?: null | string;
  };
};
export type SignupResponse = {
  response: Response;
  body: SignupResponseBody;
};

export type BuildResult = {
  payload: UserPayload;
  signup: SignupResponse;
  verificationUrl?: string;
};

type Props = {
  dbClient: Client;
  httpClient: HttpClient;
  mailhogClient: MailhogClient;
};

export class SignupUserFlowBuilder {
  private payload?: UserPayload;
  private shouldVerify = false;
  private roleName?: string;

  private constructor(private readonly props: Props) {}

  static create(props: Props): SignupUserFlowBuilder {
    return new SignupUserFlowBuilder(props);
  }

  random(): this {
    this.payload = this.randomPayload();
    return this;
  }

  withPayload(payload: Partial<UserPayload>): this {
    const base = this.payload ?? this.randomPayload();
    this.payload = { ...base, ...payload };
    return this;
  }

  verified(): this {
    this.shouldVerify = true;
    return this;
  }

  asRole(roleName: string): this {
    this.roleName = roleName;
    return this;
  }

  async build(): Promise<BuildResult> {
    const payload = this.payload ?? this.randomPayload();
    const signup = await this.sendSignupRequest(payload);

    let verificationUrl: string | undefined;

    if (this.shouldVerify) {
      verificationUrl = await this.extractVerificationUrl(
        signup.body.user.email,
      );
      await this.verifySignup(verificationUrl);
    }

    if (this.roleName) {
      await this.changeUserRole(signup.body.user.id, this.roleName);
    }
    const user = await this.fetchUserFromDatabase(signup.body.user.id);
    const userRole = await this.fetchRoleFromDatabase(user.roleId);
    expect(user.emailVerified).toStrictEqual(this.shouldVerify);
    expect(userRole.name).toStrictEqual(this.roleName ?? 'customer');
    return {
      payload,
      signup,
      verificationUrl,
    };
  }
  //==================
  private async fetchUserFromDatabase(
    userId: string,
  ): Promise<UserDatabaseDto> {
    const raw = await this.props.dbClient.query<UserDatabaseDto>(
      `select * from users where id = $1`,
      [userId],
    );

    return plainToInstance(UserDatabaseDto, raw.rows[0]);
  }
  private async fetchRoleFromDatabase(
    roleId: string,
  ): Promise<RoleDatabaseDto> {
    const raw = await this.props.dbClient.query<RoleDatabaseDto>(
      `select * from roles where id = $1`,
      [roleId],
    );

    return plainToInstance(RoleDatabaseDto, raw.rows[0]);
  }
  //==================
  private randomPayload(): UserPayload {
    const value = v7();
    return {
      name: 'storetest',
      email: `${value}@resend.dev`,
      password: value,
    };
  }

  private async sendSignupRequest(
    payload: UserPayload,
  ): Promise<SignupResponse> {
    const response = await this.props.httpClient
      .post('/api/auth/sign-up/email')
      .send(payload)
      .expect(200);

    return {
      response,
      body: response.body as SignupResponseBody,
    };
  }

  private async extractVerificationUrl(email: string): Promise<string> {
    const message = await this.props.mailhogClient.getLastEmail({
      to: email,
      subject: 'Verify your email',
    });

    if (!message) {
      throw new Error(`Verification email was not found for ${email}`);
    }

    const urls = this.extractHref(message.html ?? '');

    const verificationUrl =
      urls.find((u) => u.includes('/api/auth/verify-email')) ?? urls[0];

    if (!verificationUrl) {
      throw new Error(`Verification URL was not found for ${email}`);
    }

    return verificationUrl;
  }
  private extractHref(html: string): string[] {
    const matches = [...html.matchAll(/href=["']([^"']+)["']/gi)];
    return matches.map((m) => m[1]);
  }
  private async verifySignup(verificationUrl: string): Promise<void> {
    const url = new URL(verificationUrl);
    await this.props.httpClient.get(`${url.pathname}${url.search}`).expect(302);
  }

  private async changeUserRole(
    userId: string,
    roleName: string,
  ): Promise<void> {
    const roleQuery = await this.props.dbClient.query<{ id: string }>(
      `select id from roles where name = $1 limit 1`,
      [roleName],
    );

    const role = roleQuery.rows[0];

    if (!role) {
      throw new Error(`Role '${roleName}' was not found`);
    }

    await this.props.dbClient.query(
      `update users set role_id = $1 where id = $2`,
      [role.id, userId],
    );
  }
}
