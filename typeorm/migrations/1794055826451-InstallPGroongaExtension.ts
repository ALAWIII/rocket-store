import { MigrationInterface, QueryRunner } from "typeorm";

export class InstallPGroongaExtension1794055826451 implements MigrationInterface {

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
