import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildAuthEmailHtml } from './email-message.template';

@Injectable()
export class ResendEmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger: Logger = new Logger(ResendEmailService.name);
  private readonly logoUrl: string;
  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('MAIL_FROM');
    this.logoUrl = config.getOrThrow<string>('LOGO_URL');
  }
  async sendVerificationEmail(
    to: string,
    url: string,
    name?: string,
  ): Promise<void> {
    const html = buildAuthEmailHtml({
      storeName: 'Rocket Store',
      logoUrl: this.logoUrl,
      recipientName: name,
      heading: 'Verify your email',
      message:
        'Confirm your email address to activate your Rocket Store account.',
      buttonText: 'Verify Email',
      url,
      expiresInText: 'This link expires in 24 hours.',
      accentColor: '#f97316',
    });
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject: 'Verify your email',
      html,
    });
    if (error)
      this.logger.error(
        `Failed to send verification email to ${to}: ${error.message}`,
      );
  }

  async sendPasswordResetEmail(
    to: string,
    url: string,
    name?: string,
  ): Promise<void> {
    const html = buildAuthEmailHtml({
      storeName: 'Rocket Store',
      logoUrl: this.logoUrl,
      recipientName: name,
      heading: 'Reset your password',
      message:
        'We received a request to reset your password. Click below to set a new one.',
      buttonText: 'Reset Password',
      url,
      expiresInText: 'This link expires in 1 hour.',
      accentColor: '#f97316',
    });
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject: 'Reset your Rocket Store password',
      html,
    });
    if (error)
      this.logger.error(
        `Failed to send password-reset email to ${to}: ${error.message}`,
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
      storeName: 'Rocket Store',
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
