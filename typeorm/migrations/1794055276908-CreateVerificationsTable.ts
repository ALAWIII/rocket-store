import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVerificationsTable1794055276908 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(/*sql*/`
        CREATE TABLE IF NOT EXISTS "verifications" (
          "id" uuid NOT NULL,
          "identifier" text NOT NULL,
          "value" text NOT NULL,
          "expiresAt" timestamptz NOT NULL,
          "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_verifications" PRIMARY KEY ("id")
        );
      `);

      await queryRunner.query(/*sql*/`
        CREATE INDEX IF NOT EXISTS "verification_identifier_idx"
        ON "verifications" ("identifier");
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP INDEX IF EXISTS "verification_identifier_idx";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "verifications";`);
    }

}
