import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductsPgroongaSearchIndex1794055956411 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE INDEX IF NOT EXISTS idx_products_search_pgroonga
      ON products
      USING pgroonga (title, description);
    `);

    await queryRunner.query(`
      ANALYZE products;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_search_pgroonga;
    `);
  }
}
