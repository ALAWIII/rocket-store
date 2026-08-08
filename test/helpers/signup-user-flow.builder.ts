import { v7 } from 'uuid';
import { UserAgent } from './app-test.helper';
import { Response } from 'supertest';
import { MailhogClient } from 'mailhog-awesome';
import { extractUrlsFromHtml } from 'test/utils/extract-url-from-html.util';
import { DataSource } from 'typeorm';
import { RoleEntity } from 'src/modules/access-control/infrastructure/entities/role.entity';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';

type UserPayload = {
  name: string;
  email: string;
  password: string;
};

export type UserProps = {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  emailVerified?: boolean;
  image?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  givenName?: null | string; //the givenName, familyName and roleId fields appears when firing a request second time to signup endpoint.
  familyName?: null | string;
};
export type SignupResponseBody = {
  token: string | null;
  user: UserProps;
};
export type SignupResponse = {
  response: Response;
  body: SignupResponseBody;
};

export type SignupResult = {
  userAgent: UserAgent;
  userDb: UserProps;
  payload: UserPayload;
  signup: SignupResponse;
  verificationUrl?: string;
};

type Props = {
  dbDataSource: DataSource;
  userAgent: UserAgent;
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

  async build(): Promise<SignupResult> {
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
    const userRole = await this.fetchRoleFromDatabase(user.roleId!);
    expect(user.emailVerified).toStrictEqual(this.shouldVerify);
    expect(userRole.name).toStrictEqual(this.roleName ?? 'customer');
    return {
      userDb: user,
      userAgent: this.props.userAgent,
      payload,
      signup,
      verificationUrl,
    };
  }
  //==================
  private async fetchUserFromDatabase(userId: string): Promise<UserProps> {
    const user = await this.props.dbDataSource
      .getRepository(UserEntity)
      .findOneByOrFail({ id: userId });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      emailVerified: user.emailVerified,
      image: user.image,
      phone: user.phone,
      givenName: user.givenName,
      familyName: user.familyName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
  private async fetchRoleFromDatabase(roleId: string): Promise<RoleEntity> {
    return await this.props.dbDataSource
      .getRepository(RoleEntity)
      .findOneByOrFail({ id: roleId });
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
    const response = await this.props.userAgent
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

    const urls = extractUrlsFromHtml(message.html ?? '');

    const verificationUrl =
      urls.find((u) => u.includes('/api/auth/verify-email')) ?? urls[0];

    if (!verificationUrl) {
      throw new Error(`Verification URL was not found for ${email}`);
    }

    return verificationUrl;
  }

  private async verifySignup(verificationUrl: string): Promise<void> {
    const url = new URL(verificationUrl);
    await this.props.userAgent.get(`${url.pathname}${url.search}`).expect(302);
  }

  private async changeUserRole(
    userId: string,
    roleName: string,
  ): Promise<void> {
    const role = await this.props.dbDataSource
      .getRepository(RoleEntity)
      .findOneByOrFail({ name: roleName });

    const result = await this.props.dbDataSource
      .getRepository(UserEntity)
      .update({ id: userId }, { roleId: role.id });

    if (result.affected !== 1) {
      throw new Error(`User was not found: ${userId}`);
    }
  }
}
