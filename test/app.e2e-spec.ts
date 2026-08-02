import { TestDatabase } from './helpers/database-test.helper';
import { createConfigServiceMock } from './helpers/config-test.helper';
import { TEST_ENV } from './helpers/env-test-values';
import { TestApp } from './helpers/app-test.helper';
import { MailhogClient } from 'mailhog-awesome';
import { createMailhogClient } from './helpers/mailhog-client.helper';
import {
  BuildResult,
  SignupUserFlowBuilder,
} from './helpers/signup-user-flow.builder';
import { SigninUserHelper } from './helpers/signin-user.helper';

describe('AppController (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUserResult: BuildResult;
  beforeEach(async () => {
    mailClient = createMailhogClient();
    db = await TestDatabase.create({
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
    app = await TestApp.create(configServiceMock);
    adminUserResult = await SignupUserFlowBuilder.create({
      mailhogClient: mailClient,
      dbClient: db.dbClient,
      httpClient: app.httpClient,
    })
      .random()
      .verified()
      .asRole('admin')
      .build();
    await new SigninUserHelper(app.httpClient).signin({
      email: adminUserResult.payload.email,
      password: adminUserResult.payload.password,
    });
  });

  it('GET /api/auth/ok it should return 200 success', () => {
    const response = app.httpClient.get('/api/auth/ok');
    return response.expect(200);
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
  });
});
