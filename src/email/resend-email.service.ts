import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendEmailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(
    config: ConfigService,
    private readonly logger: Logger,
  ) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('MAIL_FROM');
  }

  async sendVerificationEmail(to: string, url: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject: 'Verify your email',
      html: `
        <p>Welcome to Rocket Store.</p>
        <p><a href="${url}">Verify your email</a></p>
      `,
    });

    if (error) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${error.message}`,
      );
    }
  }
}
