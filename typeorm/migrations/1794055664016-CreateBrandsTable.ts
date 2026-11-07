import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBrandsTable1794055664016 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" uuid NOT NULL,
        "name" varchar(50) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brands" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_brands_name" UNIQUE ("name")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "brands";`);
  }

}
