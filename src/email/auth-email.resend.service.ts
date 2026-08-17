import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildAuthEmailHtml } from './email-message.template';
import { IAuthEmailService, SendEmailParams } from './auth-email.service';

@Injectable()
export class ResendAuthEmailService implements IAuthEmailService {
  private readonly resend: Resend;
  private readonly storeName: string;
  private readonly from: string;
  private readonly logger: Logger = new Logger(IAuthEmailService.name);
  private readonly logoUrl: string | undefined;
  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('MAIL_FROM');
    this.storeName = config.get<string>('STORE_NAME') ?? 'Nuclear Store';
    this.logoUrl = config.get<string>('LOGO_URL');
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
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [params.to],
      subject: 'Verify your email',
      html,
    });
    if (error)
      this.logger.error(
        `Failed to send verification email to ${params.to}: ${error.message}`,
      );
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
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [params.to],
      subject: 'Reset your password',
      html,
    });
    if (error)
      this.logger.error(
        `Failed to send password-reset email to ${params.to}: ${error.message}`,
      );
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

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject: 'Approve Email Change',
      html,
    });
    if (error)
      this.logger.error(
        `Failed to send change email confirmation message to ${to}: ${error.message}`,
      );
  }
}
