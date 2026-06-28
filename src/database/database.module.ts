import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
        autoLoadEntities: true,
        migrationsRun: true,
        synchronize: config.get<boolean>('DB_SYNC'), // for development only
        poolSize: 50,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
