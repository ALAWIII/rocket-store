import path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'allawiii',
  password: '0788',
  database: 'store',
  synchronize: true,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrationsRun: true,
  poolSize: 50,
});
