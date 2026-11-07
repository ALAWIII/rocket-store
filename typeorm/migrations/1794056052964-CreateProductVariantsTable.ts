import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductVariantsTable1794056052964 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "price" integer NOT NULL,
        "quantity" integer NOT NULL,
        "info" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "description" varchar(2000),
        "status" varchar(9) NOT NULL,
        "sortOrder" integer NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_product_variants"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_product_variants_productId"
          FOREIGN KEY ("productId")
          REFERENCES "products"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants";`);
  }

}
