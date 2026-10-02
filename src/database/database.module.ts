import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';
import { AppConfigService } from 'src/app-config/app-config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'postgres',
        url: config.db.url,
        entities: [
          path.join(process.cwd(), 'dist/**/*.entity.js'),
          path.join(process.cwd(), 'dist/typeorm/entities/*.js'),
        ],
        migrations: [
          path.join(process.cwd(), 'dist/typeorm/migrations/**/*.js'),
        ],
        autoLoadEntities: true,
        migrationsRun: true,
        synchronize: config.db.sync,
        poolSize: config.db.poolSize,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
