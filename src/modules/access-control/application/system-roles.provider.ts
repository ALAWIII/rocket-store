import { Injectable } from '@nestjs/common';
import { Role } from '../domain/role';

@Injectable()
export class SystemRolesProvider {
  getAll() {
    return [
      Role.create({ name: 'admin', permissions: [] }),
      Role.create({ name: 'worker', permissions: [] }),
      Role.create({ name: 'customer', permissions: [] }),
    ].map((r) => r.unwrap());
  }

  getNames(): string[] {
    return this.getAll().map((r) => r.name);
  }
}
