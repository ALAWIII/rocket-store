import { MailhogClient } from 'mailhog-awesome';

export function createMailhogClient(options?: {
  host?: string;
  port?: number;
}): MailhogClient {
  return new MailhogClient({
    host: options?.host ?? '127.0.0.1',
    port: options?.port ?? 1025,
  });
}
