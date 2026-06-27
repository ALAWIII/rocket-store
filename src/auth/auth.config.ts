import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import { DataSource } from 'typeorm';

export function createAuth(dataSource: DataSource) {
  return betterAuth({
    database: typeormAdapter(dataSource),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
  });
}
