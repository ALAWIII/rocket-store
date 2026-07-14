import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesPermissionsGinIndex1784028100848 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_permissions_gin"
      ON "roles"
      USING GIN ("permissions" jsonb_path_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_roles_permissions_gin"
    `);
  }
}
