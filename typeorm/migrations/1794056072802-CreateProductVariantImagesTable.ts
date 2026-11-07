import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductVariantImagesTable1794056072802 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "product_variant_images" (
        "id" uuid NOT NULL,
        "imageId" uuid NOT NULL,
        "productVariantId" uuid NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_product_variant_images"
          PRIMARY KEY ("id"),

        CONSTRAINT "uq_product_variant_image"
          UNIQUE ("productVariantId", "imageId"),

        CONSTRAINT "FK_product_variant_images_imageId"
          FOREIGN KEY ("imageId")
          REFERENCES "images"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_product_variant_images_productVariantId"
          FOREIGN KEY ("productVariantId")
          REFERENCES "product_variants"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant_images";`);
  }
}
