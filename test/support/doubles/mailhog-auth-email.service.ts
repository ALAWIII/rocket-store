import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import {
  IAuthEmailService,
  SendEmailParams,
} from 'src/email/auth-email.service';
import { buildAuthEmailHtml } from 'src/email/email-message.template';
type MailSendResult = {
  messageId?: string;
  response?: string;
  envelope?: unknown;
};
@Injectable()
export class MailHogAuthEmailService implements IAuthEmailService {
  private readonly sender: Transporter;
  private readonly storeName: string;
  private readonly from: string;
  private readonly logger = new Logger(MailHogAuthEmailService.name);
  private readonly logoUrl?: string;

  constructor(config: ConfigService) {
    this.from = config.getOrThrow<string>('MAIL_FROM');
    this.storeName = config.get<string>('STORE_NAME') ?? 'Rocket Store';
    this.logoUrl = config.get<string>('LOGO_URL');

    this.sender = createTransport({
      host: config.get<string>('MAILHOG_SMTP_HOST') ?? '127.0.0.1',
      port: config.get<number>('MAILHOG_SMTP_PORT') ?? 1025,
      secure: false,
    });
  }
  async sendVerificationEmail(params: SendEmailParams): Promise<void> {
    const html = buildAuthEmailHtml({
      storeName: this.storeName,
      logoUrl: this.logoUrl,
      recipientName: params.name,
      heading: 'Verify your email',
      message:
        'Confirm your email address to activate your Rocket Store account.',
      buttonText: 'Verify Email',
      url: params.url,
      expiresInText: 'This link expires in 24 hours.',
      accentColor: '#f97316',
    });

    try {
      const info = (await this.sender.sendMail({
        from: this.from,
        to: params.to,
        subject: 'Verify your email',
        html,
      })) as MailSendResult;

      this.logger.log(
        `Verification email sent to ${params.to}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to send verification email to ${params.to}: ${message}`,
      );
    }
  }
  async sendPasswordResetEmail(params: SendEmailParams): Promise<void> {
    const html = buildAuthEmailHtml({
      storeName: this.storeName,
      logoUrl: this.logoUrl,
      recipientName: params.name,
      heading: 'Reset your password',
      message:
        'We received a request to reset your password. Click below to set a new one.',
      buttonText: 'Reset Password',
      url: params.url,
      expiresInText: 'This link expires in 1 hour.',
      accentColor: '#f97316',
    });
    try {
      const info = (await this.sender.sendMail({
        from: this.from,
        to: [params.to],
        subject: 'Reset your Rocket Store password',
        html,
      })) as MailSendResult;

      this.logger.log(
        `Password-reset email sent to ${params.to}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to send password-reset email to ${params.to}: ${message}`,
      );
    }
  }
  async sendChangeEmailConfirmation(params: {
    to: string;
    currentEmail: string;
    newEmail: string;
    url: string;
    name?: string;
  }): Promise<void> {
    const { to, currentEmail, newEmail, url, name } = params;

    const html = buildAuthEmailHtml({
      storeName: this.storeName,
      recipientName: name,
      heading: 'Confirm email change',
      message: `We received a request to change your account email from ${currentEmail} to ${newEmail}. If this was you, confirm the change below.`,
      buttonText: 'Approve Change',
      url,
    });

    try {
      const info = (await this.sender.sendMail({
        from: this.from,
        to: [to],
        subject: 'Approve Email Change',
        html,
      })) as MailSendResult;

      this.logger.log(
        `confirmation email change sent to ${params.to}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to send change email confirmation message to ${to}: ${message}`,
      );
    }
  }
}
