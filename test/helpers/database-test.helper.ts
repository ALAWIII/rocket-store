import { Client } from 'pg';
import { v7 } from 'uuid';

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
    readonly dbClient: Client,
    private readonly adminOptions: CreateTestDatabaseOptions,
  ) {}

  static async create(options: CreateTestDatabaseOptions) {
    const databaseName = `test_${v7().replace(/-/g, '')}`;
    const encodedUser = encodeURIComponent(options.user);
    const encodedPassword = encodeURIComponent(options.password);
    const databaseUrl = `postgresql://${encodedUser}:${encodedPassword}@${options.host}:${options.port}/${databaseName}`;

    const adminClient = new Client({ ...options });
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    await adminClient.end();

    const dbCon = new Client({ connectionString: databaseUrl });
    await dbCon.connect();

    return new TestDatabase(databaseName, databaseUrl, dbCon, options);
  }

  async cleanup() {
    await this.dbClient.end();

    const adminClient = new Client({ ...this.adminOptions });
    await adminClient.connect();
    await adminClient.query(
      `DROP DATABASE IF EXISTS "${this.databaseName}" WITH (FORCE)`,
    );
    await adminClient.end();
  }
}
