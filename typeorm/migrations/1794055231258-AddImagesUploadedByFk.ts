import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImagesUploadedByFk1794055231258 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_images_uploadedBy'
            AND conrelid = '"images"'::regclass
        ) THEN
          ALTER TABLE "images"
          ADD CONSTRAINT "FK_images_uploadedBy"
          FOREIGN KEY ("uploadedBy")
          REFERENCES "users"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/*sql*/`
      ALTER TABLE "images"
      DROP CONSTRAINT IF EXISTS "FK_images_uploadedBy";
    `);
  }
}
