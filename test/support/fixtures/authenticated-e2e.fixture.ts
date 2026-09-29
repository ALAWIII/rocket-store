import { test as baseTest } from 'vitest';
import { TestApp } from '../helpers/app-test.helper';
import { createConfigServiceMock } from '../doubles/config-service-mock.double';
import { TestDatabase } from '../helpers/database-test.helper';
import { TEST_ENV } from '../constants/env-test-values.constant';
import { createMailhogClient } from '../helpers/mailhog-client.helper';
import { UserAuthFlowBuilder } from '../helpers/auth-user-flow.builder';
import { RolesControllerTest } from '../controllers/roles.controller-test';
import { UsersControllerTest } from '../controllers/users/users.controller-test';
import {
  MyAddressesControllerTest,
  UserAddressesControllerTest,
} from '../controllers/users/addresses.controller-test';
import { ImagesControllerTest } from '../controllers/images.controller-test';
import { ObjectStorageClientTest } from '../helpers/object-storage-client.helper';
import { BrandsControllerTest } from '../controllers/brands.controller-test';

export const test = baseTest
  .extend('mailClient', async () => {
    const mailClient = createMailhogClient();
    return mailClient;
  })
  .extend('db', async ({}, { onCleanup }) => {
    const db = await TestDatabase.create({
      host: TEST_ENV.DB_HOST,
      port: TEST_ENV.DB_PORT,
      user: TEST_ENV.DB_USERNAME,
      password: TEST_ENV.DB_PASSWORD,
      database: TEST_ENV.ADMIN_DATABASE,
    });
    onCleanup(async () => db.cleanup());
    return db;
  })
  .extend('storageClient', async ({}, { onCleanup }) => {
    const storage = await ObjectStorageClientTest.create();
    onCleanup(async () => storage.cleanup());
    return storage;
  })
  .extend('app', async ({ db, storageClient }, { onCleanup }) => {
    const configServiceMock = createConfigServiceMock({
      DATABASE_URL: db.databaseUrl,
      DB_NAME: db.databaseName,
      STORAGE_BUCKET: storageClient.bucket,
    });
    const app = await TestApp.create(configServiceMock);
    onCleanup(async () => app.cleanup());
    return app;
  })
  .extend('adminUser', async ({ app, db, mailClient }) => {
    const adminAgent = app.createAgent();
    const adminUser = await UserAuthFlowBuilder.create({
      mailhogClient: mailClient,
      dbDataSource: db.dataSource,
      userAgent: adminAgent,
    })
      .random()
      .verified()
      .asRole('admin')
      .signin()
      .build();
    return adminUser;
  })
  .extend('userController', async ({ adminUser }) => {
    return new UsersControllerTest(adminUser.userAgent);
  })
  .extend('roleController', async ({ adminUser }) => {
    return new RolesControllerTest(adminUser.userAgent);
  })
  .extend('myAddressController', async ({ adminUser }) => {
    return new MyAddressesControllerTest(adminUser.userAgent);
  })
  .extend('userAddressController', async ({ adminUser }) => {
    return new UserAddressesControllerTest(adminUser.userAgent);
  })
  .extend('imageController', async ({ adminUser }) => {
    return new ImagesControllerTest(adminUser.userAgent);
  })
  .extend(
    'brandController',
    async ({ adminUser }) => new BrandsControllerTest(adminUser.userAgent),
  );
export const it = test;
