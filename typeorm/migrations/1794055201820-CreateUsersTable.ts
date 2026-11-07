import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1794055201820 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL,
        "name" varchar(50) NOT NULL,
        "givenName" varchar(50),
        "familyName" varchar(50),
        "email" text NOT NULL,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "phone" varchar(20),
        "image" uuid,
        "roleId" uuid NOT NULL,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_users"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_users_email"
          UNIQUE ("email"),

        CONSTRAINT "FK_users_image"
          FOREIGN KEY ("image")
          REFERENCES "images"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_users_roleId"
          FOREIGN KEY ("roleId")
          REFERENCES "roles"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
  }
}
