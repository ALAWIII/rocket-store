// dummy file that is used to generate the required better auth migration files.

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: typeormAdapter(dataSource),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
