import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesTable1784028100847 implements MigrationInterface {
  name = 'CreateRolesTable1784028100847';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuidv7(),
        "name" varchar(50) NOT NULL UNIQUE,
        "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "create_scope" jsonb NULL,
        "assign_scope" jsonb NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "roles";
    `);
  }
}
