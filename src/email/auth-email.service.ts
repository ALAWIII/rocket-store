export type SendEmailParams = { to: string; url: string; name?: string };

export abstract class IAuthEmailService {
  abstract sendVerificationEmail(param: SendEmailParams): Promise<void>;
  abstract sendPasswordResetEmail(param: SendEmailParams): Promise<void>;
  abstract sendChangeEmailConfirmation(params: {
    to: string;
    currentEmail: string;
    newEmail: string;
    url: string;
    name?: string;
  }): Promise<void>;
}
