import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'allawiii',
      password: '0788',
      database: 'store',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
