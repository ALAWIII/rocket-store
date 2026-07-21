import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignRoleScopePermissions1784632588358 implements MigrationInterface {
  name = 'AddAssignRoleScopePermissions1784632588358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "roles"
      ADD COLUMN IF NOT EXISTS "assign_scope" jsonb NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_assign_role_scope_gin"
      ON "roles"
      USING gin ("assign_scope" jsonb_path_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_roles_assign_role_scope_gin"
    `);

    await queryRunner.query(`
      ALTER TABLE "roles"
      DROP COLUMN IF EXISTS "assign_scope"
    `);
  }
}
