import { Client } from 'pg';
import { v7 } from 'uuid';
import { DataSource } from 'typeorm';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { RoleEntity } from 'src/modules/access-control/infrastructure/entities/role.entity';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
export interface CreateTestDatabaseOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export class TestDatabase {
  constructor(
    readonly databaseName: string,
    readonly databaseUrl: string,
    readonly dataSource: DataSource,
    private readonly adminOptions: CreateTestDatabaseOptions,
  ) {}

  static async create(options: CreateTestDatabaseOptions) {
    const databaseName = `test_${v7().replace(/-/g, '')}`;
    const databaseUrl = `postgresql://${encodeURIComponent(options.user)}:${encodeURIComponent(options.password)}@${options.host}:${options.port}/${databaseName}`;

    // Keep your existing pg Client here to CREATE DATABASE.
    const adminClient = new Client({ ...options });
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    await adminClient.end();

    const dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [UserEntity, RoleEntity, ImageEntity],
      migrations: [],
    });

    await dataSource.initialize();

    return new TestDatabase(databaseName, databaseUrl, dataSource, options);
  }

  async cleanup() {
    await this.dataSource.destroy();

    const adminClient = new Client({ ...this.adminOptions });
    await adminClient.connect();
    await adminClient.query(
      `DROP DATABASE IF EXISTS "${this.databaseName}" WITH (FORCE)`,
    );
    await adminClient.end();
  }
}
