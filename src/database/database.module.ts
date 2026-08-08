import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow('DATABASE_URL'),
        entities: [
          path.join(process.cwd(), 'dist/**/*.entity.js'),
          path.join(process.cwd(), 'dist/typeorm/entities/*.js'),
        ],
        migrations: [
          path.join(process.cwd(), 'dist/typeorm/migrations/**/*.js'),
        ],
        autoLoadEntities: true,
        migrationsRun: true,
        synchronize: config.get<string>('DB_SYNC') === 'true', // for development only
        poolSize: 50,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
