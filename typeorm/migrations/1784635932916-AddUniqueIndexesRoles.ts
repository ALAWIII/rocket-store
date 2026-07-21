import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueIndexesRoles1784635932916 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_roles_permissions"
      ON "roles" ("permissions")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_roles_permissions_create_scope"
      ON "roles" ("permissions", "create_scope")
      NULLS NOT DISTINCT
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_roles_permissions_assign_scope"
      ON "roles" ("permissions", "assign_scope")
      NULLS NOT DISTINCT
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_roles_permissions_assign_create_scope"
      ON "roles" ("permissions", "assign_scope", "create_scope")
      NULLS NOT DISTINCT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_roles_permissions_assign_create_scope"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_roles_permissions_assign_scope"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_roles_permissions_create_scope"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_roles_permissions"
    `);
  }
}
