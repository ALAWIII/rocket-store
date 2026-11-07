import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBrandImagesTable1794055682578 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "brand_images" (
        "id" uuid NOT NULL,
        "brandId" uuid NOT NULL,
        "imageId" uuid NOT NULL,
        "imageRole" varchar(10) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_brand_images"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_brand_images_brandId"
          FOREIGN KEY ("brandId")
          REFERENCES "brands"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_brand_images_imageId"
          FOREIGN KEY ("imageId")
          REFERENCES "images"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(/*sql*/`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_brand_logo"
      ON "brand_images" ("brandId")
      WHERE "imageRole" = 'logo';
    `);

    await queryRunner.query(/*sql*/`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_brand_image"
      ON "brand_images" ("brandId", "imageId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_brand_image";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_brand_logo";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brand_images";`);
  }
}
