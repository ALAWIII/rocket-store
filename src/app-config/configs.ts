import { ConfigReader } from './config-reader';

export class AuthConfig {
  readonly betterAuthSecret: string;
  readonly betterAuthUrl: string;
  readonly googleWebClientId: string;
  readonly googleClientSecret: string;

  constructor(cfg: ConfigReader) {
    this.betterAuthSecret = cfg.getOrThrow<string>('BETTER_AUTH_SECRET');
    this.betterAuthUrl = cfg.get<string>(
      'BETTER_AUTH_URL',
      'http://localhost:3000',
    );
    this.googleWebClientId = cfg.getOrThrow<string>('GOOGLE_WEB_CLIENT_ID');
    this.googleClientSecret = cfg.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
  }
}

export class DatabaseConfig {
  readonly url: string;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly name: string;
  readonly sync: boolean;
  readonly pgBossPoolSize: number;
  readonly poolSize: number;

  constructor(cfg: ConfigReader) {
    this.url = cfg.getOrThrow<string>('DATABASE_URL');
    this.host = cfg.getOrThrow<string>('DB_HOST');
    this.port = Number(cfg.get<string>('DB_PORT', '5432'));
    this.username = cfg.getOrThrow<string>('DB_USERNAME');
    this.password = cfg.getOrThrow<string>('DB_PASSWORD');
    this.name = cfg.getOrThrow<string>('DB_NAME');
    this.sync = cfg.get<string>('DB_SYNC', 'false') === 'true';
    this.pgBossPoolSize = Number(cfg.get<string>('PG_BOSS_POOL_SIZE', '50'));
    this.poolSize = Number(cfg.get<string>('DATABASE_POOL_SIZE', '50'));
  }
}

export class ApplicationConfig {
  readonly logLevel: string;
  readonly storeName: string;
  readonly logoUrl: string;
  readonly isDevelopmentEnv: boolean;
  constructor(cfg: ConfigReader) {
    this.isDevelopmentEnv = Boolean(cfg.get('IS_DEVELOPMENT_ENV', false));
    this.logLevel = cfg.get<string>('LOG_LEVEL', 'info');
    this.storeName = cfg.get<string>('STORE_NAME', 'Nuclear Store');
    this.logoUrl = cfg.get<string>('LOGO_URL', this.storeName);
  }
}

export class MailConfig {
  readonly resendApiKey: string;
  readonly mailFrom: string;

  constructor(cfg: ConfigReader) {
    this.resendApiKey = cfg.getOrThrow<string>('RESEND_API_KEY');
    this.mailFrom = cfg.getOrThrow<string>('MAIL_FROM');
  }
}

export class StorageConfig {
  readonly region: string;
  readonly endpoint: string;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly adminName: string;
  readonly adminKey: string;
  readonly maxSockets: number;
  readonly bucket: string;

  constructor(cfg: ConfigReader) {
    this.region = cfg.get<string>('RUSTFS_REGION', 'us-east-1');
    this.endpoint = cfg.getOrThrow<string>('RUSTFS_ENDPOINT');
    this.accessKey = cfg.getOrThrow<string>('RUSTFS_ACCESS_KEY');
    this.secretKey = cfg.getOrThrow<string>('RUSTFS_SECRET_KEY');
    this.adminName = cfg.get<string>('RUSTFS_ADMIN_NAME', 'admin');
    this.adminKey = cfg.getOrThrow<string>('RUSTFS_ADMIN_KEY');
    this.maxSockets = Number(cfg.get<string>('RUSTFS_MAX_SOCKETS', '256'));
    this.bucket = cfg.get<string>('STORAGE_BUCKET', 'images');
  }
}
