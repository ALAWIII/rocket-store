import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from './helpers/app-test.helper';
import { TestDatabase } from './helpers/database-test.helper';
import { SignupResult } from './helpers/signup-user-flow.builder';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';

describe('users (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: SignupResult;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());
  });
  describe('GET /api/v1/users/me (findMe)', () => {
    it('should return user profile.', async () => {
      const userResp = await adminUser.userAgent
        .get('/api/v1/users/me')
        .expect(200);
      expect(userResp.body).toEqual({
        id: adminUser.userDb.id,
        name: adminUser.userDb.name,
        email: adminUser.userDb.email,
        roleId: adminUser.userDb.roleId,
        createdAt: adminUser.userDb.createdAt,
        updatedAt: adminUser.userDb.updatedAt,
      });
    });
  });
  describe('GET /api/auth/get-session', () => {
    it('should return session user profile.', async () => {
      const response = await adminUser.userAgent
        .get('/api/auth/get-session')
        .expect(200);
      const sessionBody = response.body as SessionResponse;
      expect(sessionBody.user.id).toEqual(adminUser.userDb.id);
      expect(sessionBody.session.userId).toEqual(adminUser.userDb.id);
      expect(sessionBody.user.roleId).toEqual(adminUser.userDb.roleId);
      expect(sessionBody.session.roleId).toEqual(adminUser.userDb.roleId);
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
    await mailClient.deleteEmails({ to: adminUser.userDb.email });
  });
});

type SessionResponse = {
  user: {
    name: string;
    email: string;
    emailVerified: true;
    image?: null | string;
    createdAt: string;
    updatedAt: string;
    phone: null;
    id: string;
    roleId: string;
  };
  session: {
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string;
    userAgent: string;
    userId: string;
    roleId: string;
    id: string;
  };
};
