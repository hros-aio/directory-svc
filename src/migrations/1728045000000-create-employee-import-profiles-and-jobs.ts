import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeeImportProfilesAndJobs1728045000000 implements MigrationInterface {
  name = 'CreateEmployeeImportProfilesAndJobs1728045000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_import_profiles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_code" VARCHAR(64) NULL,
        "company_id" UUID NULL,
        "name" VARCHAR(128) NOT NULL,
        "description" TEXT NULL,
        "config" JSONB NOT NULL,
        "version" INTEGER NOT NULL DEFAULT 1,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_by" VARCHAR(64) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_import_profiles_system_name"
      ON "employee_import_profiles" ("name")
      WHERE "tenant_code" IS NULL AND "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_import_profiles_tenant_global_name"
      ON "employee_import_profiles" ("tenant_code", "name")
      WHERE "tenant_code" IS NOT NULL AND "company_id" IS NULL AND "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_import_profiles_tenant_company_name"
      ON "employee_import_profiles" ("tenant_code", "company_id", "name")
      WHERE "tenant_code" IS NOT NULL AND "company_id" IS NOT NULL AND "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_import_profiles_tenant_company_active"
      ON "employee_import_profiles" ("tenant_code", "company_id", "is_active")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_import_jobs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_code" VARCHAR(64) NOT NULL,
        "company_id" UUID NULL,
        "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        "profile_id" UUID NULL,
        "profile_version" INTEGER NULL,
        "config_snapshot" JSONB NOT NULL,
        "created_by" VARCHAR(64) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "fk_employee_import_jobs_profile_id"
          FOREIGN KEY ("profile_id")
          REFERENCES "employee_import_profiles"("id")
          ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_import_jobs_tenant_company_status"
      ON "employee_import_jobs" ("tenant_code", "company_id", "status")
      WHERE "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_import_jobs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_import_profiles";`);
  }
}
