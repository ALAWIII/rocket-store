import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigReader } from './config-reader';
import {
  ApplicationConfig,
  AuthConfig,
  DatabaseConfig,
  MailConfig,
  StorageConfig,
} from './configs';

@Injectable()
export class AppConfigService {
  readonly auth: AuthConfig;
  readonly db: DatabaseConfig;
  readonly app: ApplicationConfig;
  readonly mail: MailConfig;
  readonly storage: StorageConfig;

  constructor(configService: ConfigService) {
    const reader: ConfigReader = new ConfigReader(configService);

    this.auth = new AuthConfig(reader);
    this.db = new DatabaseConfig(reader);
    this.app = new ApplicationConfig(reader);
    this.mail = new MailConfig(reader);
    this.storage = new StorageConfig(reader);
  }
}
