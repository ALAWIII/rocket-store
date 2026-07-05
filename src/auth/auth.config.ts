import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import { DataSource } from 'typeorm';
import { v7 } from 'uuid';
import argon2 from 'argon2';
import { openAPI } from 'better-auth/plugins';
import { IUserRepository } from 'src/modules/users/infrastructure/repositories/user.repository';

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
export function createAuth(dataSource: DataSource, userRepo: IUserRepository) {
  return betterAuth({
    database: typeormAdapter(dataSource, { usePlural: true }),
    user: {
      additionalFields: {
        givenName: { type: 'string', required: false },
        familyName: { type: 'string', required: false, returned: false },
        phone: { type: 'string', required: false, returned: false },
        roleId: {
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
