import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import { Logger } from 'nestjs-pino';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { IAuthEmailService } from 'src/email/auth-email.service';
import { MailHogAuthEmailService } from '../doubles/auth-email.mailhog.service';
import { ConfigServiceMock } from '../doubles/config-service-mock.double';

export type HttpClient = ReturnType<typeof request>;
export type UserAgent = ReturnType<typeof request.agent>;
export class TestApp {
  constructor(
    readonly app: INestApplication<Server>,
    readonly moduleRef: TestingModule,
    readonly httpClient: HttpClient,
  ) {}

  static async create(configServiceMock: ConfigServiceMock): Promise<TestApp> {
    const moduleRef = await this.createTestingModule(configServiceMock);
    const app = await this.createAndInitApp(moduleRef);
    const httpClient = request(app.getHttpServer());

    return new TestApp(app, moduleRef, httpClient);
  }
  createAgent(): UserAgent {
    return request.agent(this.app.getHttpServer());
  }
  private static async createTestingModule(
    configServiceMock: ConfigServiceMock,
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configServiceMock)
      .overrideProvider(IAuthEmailService)
      .useClass(MailHogAuthEmailService)
      .compile();
  }

  private static async createAndInitApp(
    moduleRef: TestingModule,
  ): Promise<INestApplication<Server>> {
    const app = moduleRef.createNestApplication<INestApplication<Server>>({
      bodyParser: false,
      bufferLogs: true,
    });

    app.useLogger(app.get(Logger));
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    await app.init();
    return app;
  }

  async cleanup(): Promise<void> {
    await this.app.close();
  }
}
