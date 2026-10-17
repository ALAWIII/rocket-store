import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoryTableWithIndexes1792249404511 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "categories" (
                    "id" uuid NOT NULL DEFAULT uuidv7(),
                    "name" character varying(50) NOT NULL,
                    "parentId" uuid,
                    "path" uuid[] NOT NULL DEFAULT '{}',
                    "description" character varying(125),
                    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_categories" PRIMARY KEY ("id")
                );

                ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_parentId";
                ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_parentId"
                FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL;

                CREATE INDEX IF NOT EXISTS "IDX_categories_parentId" ON "categories" ("parentId");
                CREATE INDEX IF NOT EXISTS "IDX_categories_path" ON "categories" USING gin ("path");
            `);
    }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE;`);

    }

}
