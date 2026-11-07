import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionsTable1794055309661 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.query(/*sql*/`
       CREATE TABLE IF NOT EXISTS "sessions" (
         "id" uuid NOT NULL,
         "expiresAt" timestamptz NOT NULL,
         "token" text NOT NULL,
         "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
         "updatedAt" timestamptz NOT NULL,
         "ipAddress" text,
         "userAgent" text,
         "userId" uuid NOT NULL,
         "roleId" uuid NOT NULL,
         CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
         CONSTRAINT "UQ_sessions_token" UNIQUE ("token")
       );
     `);

     // Idempotent Foreign Key
     await queryRunner.query(/*sql*/`
       DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_sessions_userId') THEN
           ALTER TABLE "sessions"
           ADD CONSTRAINT "FK_sessions_userId"
           FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
         END IF;
       END $$;
     `);

     await queryRunner.query(/*sql*/`
       CREATE INDEX IF NOT EXISTS "session_userId_idx"
       ON "sessions" ("userId");
     `);
   }

   public async down(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.query(`DROP INDEX IF EXISTS "session_userId_idx";`);
     await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "FK_sessions_userId";`);
     await queryRunner.query(`DROP TABLE IF EXISTS "sessions";`);
   }

}
