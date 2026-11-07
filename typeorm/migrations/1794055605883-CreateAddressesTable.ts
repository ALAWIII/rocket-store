import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAddressesTable1794055605883 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "addresses" (
        "id" uuid NOT NULL,
        "fullName" varchar(100) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "country" varchar(50) NOT NULL,
        "city" varchar(50) NOT NULL,
        "state" varchar(50) NOT NULL,
        "postalCode" varchar(50) NOT NULL,
        "addressLine1" varchar(50) NOT NULL,
        "addressLine2" varchar(50),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        "userId" uuid NOT NULL,

        CONSTRAINT "PK_addresses"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_addresses_user_id"
          FOREIGN KEY ("userId")
          REFERENCES "users"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "addresses";`);
  }

}
