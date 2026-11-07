import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateImagesTable1794055128057 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "images" (
        "id" uuid NOT NULL,
        "name" varchar(50) NOT NULL,
        "checksum" varchar(64) NOT NULL,
        "mimeType" varchar(20) NOT NULL,
        "sizeBytes" integer NOT NULL,
        "width" integer NOT NULL,
        "height" integer NOT NULL,
        "altText" varchar(125),
        "uploadedBy" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_images" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "images";`);
  }

}
