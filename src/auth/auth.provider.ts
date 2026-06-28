import { FactoryProvider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';

export const AUTH = Symbol('AUTH');
export type AuthInstance = ReturnType<typeof createAuth>;

export const authProvider: FactoryProvider<AuthInstance> = {
  provide: AUTH,
  inject: [DataSource],
  useFactory: (dataSource: DataSource): AuthInstance => createAuth(dataSource),
};
