import { MailhogClient } from 'mailhog-awesome';

export function createMailhogClient() {
  return new MailhogClient({
    host: process.env.MAILHOG_API_HOST ?? '127.0.0.1',
    port: Number(process.env.MAILHOG_API_PORT ?? 1025),
  });
}
