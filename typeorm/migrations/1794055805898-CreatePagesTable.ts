import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePagesTable1794055805898 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "pages" (
        "id" uuid NOT NULL,
        "name" varchar(500) NOT NULL,
        "editorState" jsonb NOT NULL,
        "renderedHtml" text NOT NULL,
        "categoryId" uuid,
        "createdBy" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_pages"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_pages_categoryId"
          FOREIGN KEY ("categoryId")
          REFERENCES "categories"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_pages_createdBy"
          FOREIGN KEY ("createdBy")
          REFERENCES "users"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pages";`);
  }
}
