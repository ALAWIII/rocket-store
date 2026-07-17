import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import { DataSource } from 'typeorm';
import { v7 } from 'uuid';
import argon2 from 'argon2';
import { openAPI } from 'better-auth/plugins';
import { Request } from 'express';
import { Logger } from 'nestjs-pino';
import { AppLogLevel, loggerMethodFor } from 'src/app-logger/app-log.level';

async function betterHash(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}
async function betterVerify(data: { hash: string; password: string }) {
  return argon2.verify(data.hash, data.password);
}
export function createAuth(
  dataSource: DataSource,
  logger: Logger,
  logLevel: AppLogLevel,
) {
  return betterAuth({
    database: typeormAdapter(dataSource, { usePlural: true }),
    logger: {
      level: logLevel,
      disableColors: true,
      log: (level, message, ...args) => {
        loggerMethodFor(level, logger)(message, ...(args as unknown[]));
      },
    },
    user: {
      additionalFields: {
        givenName: {
          fieldName: 'given_name',
          type: 'string',
          required: false,
        },
        familyName: {
          fieldName: 'family_name',
          type: 'string',
          required: false,
        },
        phone: { type: 'string', required: false },
        roleId: {
          fieldName: 'role_id',
          type: 'string',
          required: true,
          references: { model: 'roles', field: 'id' },
        },
      },
      deleteUser: { enabled: false },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    advanced: { database: { generateId: () => v7() } },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      password: {
        hash: betterHash,
        verify: betterVerify,
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
    },
    disabledPaths: ['/update-user', '/delete-user'],
    plugins: [...(process.env.DEVELOPMENT_ENV === 'true' ? [openAPI()] : [])],
  });
}

type Auth = ReturnType<typeof createAuth>;
export type AppSession = Auth['$Infer']['Session'];
export type AppUser = AppSession['user'];

export interface AuthenticatedRequest extends Request {
  user: AppUser;
}
