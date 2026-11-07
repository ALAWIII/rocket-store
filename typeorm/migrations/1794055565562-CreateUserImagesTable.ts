import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserImagesTable1794055565562 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      CREATE TABLE IF NOT EXISTS "user_images" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "imageId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_user_images"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_user_images_userId"
          FOREIGN KEY ("userId")
          REFERENCES "users"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,

        CONSTRAINT "FK_user_images_imageId"
          FOREIGN KEY ("imageId")
          REFERENCES "images"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_user_image" ON "user_images" ("userId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_user_image";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_images";`);
  }
}
