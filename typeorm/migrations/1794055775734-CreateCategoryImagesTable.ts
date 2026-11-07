import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoryImagesTable1794055775734 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "category_images" (
        "id" uuid NOT NULL,
        "imageId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        "imageRole" varchar(10) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_category_images"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_category_images_imageId"
          FOREIGN KEY ("imageId")
          REFERENCES "images"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_category_images_categoryId"
          FOREIGN KEY ("categoryId")
          REFERENCES "categories"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(/*sql*/`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_category_icon"
      ON "category_images" ("categoryId")
      WHERE "imageRole" = 'icon';
    `);

    await queryRunner.query(/*sql*/`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_category_thumbnail"
      ON "category_images" ("categoryId")
      WHERE "imageRole" = 'thumbnail';
    `);

    await queryRunner.query(/*sql*/`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_category_image"
      ON "category_images" ("categoryId", "imageId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_category_image";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_category_thumbnail";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_category_icon";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "category_images";`);
  }

}
