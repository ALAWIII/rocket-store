import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

@Injectable()
export class PgBossCoreService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossCoreService.name);
  private readonly boss: PgBoss;

  constructor(config: ConfigService) {
    this.boss = new PgBoss({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      application_name: config.get<string>('STORE_NAME') ?? 'pg-boss-store',
      useListenNotify: true,
      // pool sizing (separate from TypeORM)
      max: config.get<number>('PG_BOSS_POOL_SIZE', 50),
      // we will use CLI in production DOCKERFILE, and in testing we will write code to migrate and setup the schema before run the app and tests.
      migrate: config.get<string>('NODE_ENV') ? true : false,
      createSchema: config.get<string>('NODE_ENV') ? true : false,
      //
      supervise: true,
      schedule: true,
      maintenanceIntervalSeconds: 86400, // 1 day
      queueCacheIntervalSeconds: 60,
    });

    this.boss.on('error', (err) =>
      this.logger.error(`pg-boss error: ${err.message}`, err.stack),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.boss.start(); // schema already created via CLI/migrations
    this.logger.log('pg-boss started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop({ graceful: true, timeout: 30_000 });
    this.logger.log('pg-boss stopped');
  }

  getBoss(): PgBoss {
    return this.boss;
  }
}
