import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAccountsTable1794055295754 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.query(/*sql*/`
       CREATE TABLE IF NOT EXISTS "accounts" (
         "id" uuid NOT NULL,
         "accountId" text NOT NULL,
         "providerId" text NOT NULL,
         "userId" uuid NOT NULL,
         "accessToken" text,
         "refreshToken" text,
         "idToken" text,
         "accessTokenExpiresAt" timestamptz,
         "refreshTokenExpiresAt" timestamptz,
         "scope" text,
         "password" text,
         "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
         "updatedAt" timestamptz NOT NULL,
         CONSTRAINT "PK_accounts" PRIMARY KEY ("id")
       );
     `);

     // Idempotent Foreign Key
     await queryRunner.query(/*sql*/`
       DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_accounts_userId') THEN
           ALTER TABLE "accounts"
           ADD CONSTRAINT "FK_accounts_userId"
           FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
         END IF;
       END $$;
     `);

     await queryRunner.query(/*sql*/`
       CREATE INDEX IF NOT EXISTS "account_userId_idx"
       ON "accounts" ("userId");
     `);
   }

   public async down(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.query(`DROP INDEX IF EXISTS "account_userId_idx";`);
     await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "FK_accounts_userId";`);
     await queryRunner.query(`DROP TABLE IF EXISTS "accounts";`);
   }

}
