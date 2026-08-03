import { TestApp } from 'test/helpers/app-test.helper';
import { createConfigServiceMock } from 'test/helpers/config-test.helper';
import { TestDatabase } from 'test/helpers/database-test.helper';
import { TEST_ENV } from 'test/helpers/env-test-values';
import { createMailhogClient } from 'test/helpers/mailhog-client.helper';
import { SigninUserHelper } from 'test/helpers/signin-user.helper';
import { SignupUserFlowBuilder } from 'test/helpers/signup-user-flow.builder';

export async function createAuthenticatedTestContext() {
  const mailClient = createMailhogClient();
  const db = await TestDatabase.create({
    host: TEST_ENV.DB_HOST,
    port: TEST_ENV.DB_PORT,
    user: TEST_ENV.DB_USERNAME,
    password: TEST_ENV.DB_PASSWORD,
    database: TEST_ENV.ADMIN_DATABASE,
  });
  const configServiceMock = createConfigServiceMock({
    DATABASE_URL: db.databaseUrl,
    DB_NAME: db.databaseName,
  });
  const app = await TestApp.create(configServiceMock);
  const adminAgent = app.createAgent();
  const adminUserResult = await SignupUserFlowBuilder.create({
    mailhogClient: mailClient,
    dbClient: db.dbClient,
    userAgent: adminAgent,
  })
    .random()
    .verified()
    .asRole('admin')
    .build();
  await new SigninUserHelper(adminAgent).signin({
    email: adminUserResult.payload.email,
    password: adminUserResult.payload.password,
  });
  return { app, db, mailClient, adminUser: adminUserResult };
}
