import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductCategoriesTable1794055996384 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "categoryId" uuid NOT NULL,
        "productId" uuid NOT NULL,

        CONSTRAINT "PK_product_categories"
          PRIMARY KEY ("categoryId", "productId"),

        CONSTRAINT "FK_product_categories_categoryId"
          FOREIGN KEY ("categoryId")
          REFERENCES "categories"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_product_categories_productId"
          FOREIGN KEY ("productId")
          REFERENCES "products"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_pc_cat" ON "product_categories" ("categoryId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_pc_prod" ON "product_categories" ("productId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pc_prod";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pc_cat";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_categories";`);
  }
}
