import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PgBoss } from 'pg-boss';
import { AppConfigService } from 'src/app-config/app-config.service';

@Injectable()
export class PgBossCoreService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossCoreService.name);
  private readonly _boss: PgBoss;

  constructor(config: AppConfigService) {
    this._boss = new PgBoss({
      connectionString: config.db.url,
      application_name: config.app.storeName,
      useListenNotify: true,
      // pool sizing (separate from TypeORM)
      max: config.db.pgBossPoolSize,
      // we will use CLI in production DOCKERFILE, and in testing we will write code to migrate and setup the schema before run the app and tests.
      migrate: config.app.isDevelopmentEnv,
      createSchema: config.app.isDevelopmentEnv,
      //
      supervise: true,
      schedule: true,
      maintenanceIntervalSeconds: 86400, // 1 day
      queueCacheIntervalSeconds: 60,
      connectionTimeoutMillis: 10_000, // wait for a connection 10 seconds
    });

    this._boss.on('error', (err) => this.logger.error(`pg-boss error: ${err.message}`, err.stack));
  }

  async onModuleInit(): Promise<void> {
    await this._boss.start(); // schema already created via CLI/migrations
    this.logger.log('pg-boss started');
  }

  async onModuleDestroy(): Promise<void> {
    await this._boss.stop({ graceful: true, timeout: 30_000 }); // 30 second
    this.logger.log('pg-boss stopped');
  }

  get boss(): PgBoss {
    return this._boss;
  }
}
