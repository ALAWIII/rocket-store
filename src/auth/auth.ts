// dummy file that is used to generate the required better auth migration files.

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
});

export const auth = createAuth(dataSource);
