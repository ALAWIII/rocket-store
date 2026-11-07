import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTable1794055871067 implements MigrationInterface {


  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
         CREATE TABLE IF NOT EXISTS products (
           id uuid PRIMARY KEY,
           title varchar(200) NOT NULL,
           description text NOT NULL DEFAULT '',
           status varchar(9) NOT NULL,
           "brandId" uuid NULL,
           "pageId" uuid NULL,
           "createdAt" timestamptz NOT NULL DEFAULT now(),
           "updatedAt" timestamptz NOT NULL DEFAULT now(),

           CONSTRAINT fk_products_brand
             FOREIGN KEY ("brandId")
             REFERENCES brands(id)
             ON DELETE SET NULL,

           CONSTRAINT fk_products_page
             FOREIGN KEY ("pageId")
             REFERENCES pages(id)
             ON DELETE SET NULL
         );
       `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_page
      ON products ("pageId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_brand
      ON products ("brandId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_status
      ON products ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_brand;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_page;`);
    await queryRunner.query(`DROP TABLE IF EXISTS products;`);

    }
}
