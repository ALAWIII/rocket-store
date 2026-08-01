import { TestDatabase } from './helpers/database-test.helper';
import { createConfigServiceMock } from './helpers/config-test.helper';
import { TEST_ENV } from './helpers/env-test-values';
import { TestApp } from './helpers/app-test.helper';

describe('AppController (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  beforeEach(async () => {
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
