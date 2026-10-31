import { MigrationInterface, QueryRunner } from "typeorm";

export class InstallPGroongaExtension1793430703947 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
         CREATE EXTENSION IF NOT EXISTS pgroonga;
       `);
    }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
         DROP EXTENSION IF EXISTS pgroonga CASCADE;
       `);
    }

}
