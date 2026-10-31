import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductsBtreeIndexes1793430872096 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
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
   }

}
