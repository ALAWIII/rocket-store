import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import { DataSource } from 'typeorm';
import { v7 } from 'uuid';
import argon2 from 'argon2';
import { customSession, openAPI } from 'better-auth/plugins';
import { Request } from 'express';
import { loggerMethodFor, toAppLogLevel } from 'src/app-logger/app-log.level';
import { Logger } from 'nestjs-pino';
import { IAuthEmailService } from 'src/email/auth-email.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

//========================= Types
type Auth = ReturnType<typeof createAuth>;
export type AppSession = Auth['$Infer']['Session'];
export type AppUser = AppSession['user'];
export interface AuthenticatedRequest extends Request {
  user: AppUser;
}
interface SessionWithRoleId {
  roleId: string;
}
//======================== Auth Config
export function createAuth(
  dataSource: DataSource,
  logger: Logger,
  config: ConfigService,
  customerRoleId: string,
  emailService: IAuthEmailService,
) {
  return betterAuth({
    database: typeormAdapter(dataSource, { usePlural: true }),
    //--------------------------
    logger: {
      level: toAppLogLevel(config.get('LOG_LEVEL')),
      disableColors: true,
      disabled: false,
      log: (level, message, ...args) => {
        loggerMethodFor(level, logger)(message, ...(args as unknown[]));
      },
    },
    //-----------------------
    socialProviders: {
      google: {
        prompt: 'select_account',
        clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        clientId: config.getOrThrow<string>('GOOGLE_WEB_CLIENT_ID'),
      },
    },
    //----------------------
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async (
          { user, newEmail, url, token },
          request,
        ) => {
          await emailService.sendChangeEmailConfirmation({
            to: user.email,
            currentEmail: user.email,
            newEmail,
            url,
            name: user.name,
          });
        },
      },
      additionalFields: {
        givenName: {
          fieldName: 'givenName',
          type: 'string',
          required: false,
        },
        familyName: {
          fieldName: 'familyName',
          type: 'string',
          required: false,
        },
        phone: { type: 'string', required: false },
        roleId: {
          fieldName: 'roleId',
          type: 'string',
          required: true,
          input: false,
          defaultValue: customerRoleId,
        },
      },
      deleteUser: { enabled: false },
    },
    session: {
      additionalFields: {
        roleId: {
          fieldName: 'roleId',
          type: 'string',
          required: true,
          input: false,
          returned: true,
        },
      },
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60,
        refreshCache: true,
        strategy: 'jwt',
      },
      expiresIn: 60 * 60 * 24 * 30, // expires after 30 days
    },
    //------------------------
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            let dbUser: UserEntity | null;
            try {
              dbUser = await dataSource
                .getRepository(UserEntity)
                .findOneBy({ id: session.userId });
            } catch (error) {
              throw new Error(
                `Database failure while fetching user info for session construction.`,
                { cause: error },
              );
            }

            if (!dbUser) {
              throw new UnauthorizedException(
                `User ${session.userId} not found while building session.`,
              );
            }
            return { data: { ...session, roleId: dbUser.roleId } };
          },
        },
      },
    },
    //-------------------
    secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'),
    advanced: { database: { generateId: () => v7() } },
    //--------------------
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      password: {
        hash: betterHash,
        verify: betterVerify,
      },
      sendResetPassword: async ({ user, url }) => {
        await emailService.sendPasswordResetEmail({ to: user.email, url });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await emailService.sendVerificationEmail({ to: user.email, url });
      },
    },
    //-------------------
    disabledPaths: [
      '/update-user',
      '/delete-user',
      '/delete-user/callback',
      '/account-info',
    ],
    plugins: [
      customSession(async ({ user, session }) => {
        if (!hasRoleId(session)) {
          throw new Error(
            'Expected roleId on session — check databaseHooks.session.create',
          );
        }
        return {
          user: { ...user, roleId: session.roleId },
          session,
        };
      }),
      ...(config.getOrThrow<string>('NODE_ENV') === 'development'
        ? [openAPI()]
        : []),
    ],
  });
}
function hasRoleId(session: object): session is SessionWithRoleId {
  return typeof (session as Record<string, unknown>).roleId === 'string';
}

//=======================  Hashing/verifying helper functions ============================
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
