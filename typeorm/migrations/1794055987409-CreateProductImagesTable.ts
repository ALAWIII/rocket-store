import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductImagesTable1794055987409 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id" uuid NOT NULL,
        "imageId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_product_images"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_product_images_imageId"
          FOREIGN KEY ("imageId")
          REFERENCES "images"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_product_images_productId"
          FOREIGN KEY ("productId")
          REFERENCES "products"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images";`);
  }

}
