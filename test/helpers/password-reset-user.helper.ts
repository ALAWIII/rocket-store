import { MailhogClient } from 'mailhog-awesome';
import { HttpClient } from './app-test.helper';
import { extractUrlsFromHtml } from 'test/utils/extract-url-from-html.util';

type Props = {
  httpClient: HttpClient;
  mailClient: MailhogClient;
};

type PasswordRestUserPayload = {
  email: string;
  redirectTo: string;
  password: string;
};

export class PasswordResetFlowBuilder {
  private constructor(
    private readonly props: Props,
    private payload: PasswordRestUserPayload,
  ) {}

  static create(props: Props, payload: PasswordRestUserPayload) {
    return new PasswordResetFlowBuilder(props, payload);
  }

  async build() {
    const reqPassRest = await this.requestPasswordReset();
    const passwordRestUrl = await this.extractPasswordRestUrl(
      this.payload.email,
    );
  }

  private async requestPasswordReset() {
    const response = await this.props.httpClient
      .post('/api/auth/request-password-reset')
      .send({
        email: this.payload.email,
        redirectTo: this.payload.redirectTo ?? '',
      })
      .expect((resp) => resp.statusCode >= 200 && resp.statusCode < 300);
    return response.body as { status: boolean; message: string };
  }
  private async extractPasswordRestUrl(email: string): Promise<string> {
    const message = await this.props.mailClient.getLastEmail({
      to: email,
      subject: 'Reset your password',
    });

    if (!message) {
      throw new Error(`Reset password email was not found for ${email}`);
    }

    const urls = extractUrlsFromHtml(message.html ?? '');

    const passwordResetUrl =
      urls.find((u) => u.includes('/api/auth/reset-password')) ?? urls[0];

    if (!passwordResetUrl) {
      throw new Error(`Password reset URL was not found for ${email}`);
    }

    return passwordResetUrl;
  }
  private async verifyPasswordRestToken(urlToken: string) {
    const url = new URL(urlToken); // http://localhost:3000/api/auth/reset-password/ZLjSqJAwLEq0gLvwnVzmFEgL?callbackURL=
    await this.props.httpClient.get(`${url.pathname}${url.search}`).expect(302);
  }
}
