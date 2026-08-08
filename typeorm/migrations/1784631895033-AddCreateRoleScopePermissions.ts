import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreateRoleScopePermissions1784631895033 implements MigrationInterface {
  name = 'AddCreateRoleScopePermissions1784631895033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "roles"
      ADD COLUMN IF NOT EXISTS "createScope" jsonb NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_create_role_scope_gin"
      ON "roles"
      USING gin ("createScope" jsonb_path_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_roles_create_role_scope_gin"
    `);

    await queryRunner.query(`
      ALTER TABLE "roles"
      DROP COLUMN IF EXISTS "createScope"
    `);
  }
}
