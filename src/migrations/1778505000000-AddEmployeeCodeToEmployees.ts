import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeCodeToEmployees1778505000000 implements MigrationInterface {
    name = "AddEmployeeCodeToEmployees1778505000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasEmployeesTable = await queryRunner.hasTable("employees");
        if (!hasEmployeesTable) {
            return;
        }

        const hasEmployeeCodeColumn = await queryRunner.hasColumn("employees", "employeeCode");
        if (!hasEmployeeCodeColumn) {
            await queryRunner.query(`ALTER TABLE "employees" ADD "employeeCode" character varying`);
        }

        await queryRunner.query(`
            WITH max_code AS (
                SELECT COALESCE(MAX(SUBSTRING("employeeCode" FROM 4)::integer), 0) AS value
                FROM "employees"
                WHERE "employeeCode" ~ '^TX-[0-9]+$'
            ),
            missing_codes AS (
                SELECT
                    "id",
                    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") + (SELECT value FROM max_code) AS employee_number
                FROM "employees"
                WHERE "employeeCode" IS NULL OR "employeeCode" = ''
            )
            UPDATE "employees" employee
            SET "employeeCode" = 'TX-' || LPAD(missing_codes.employee_number::text, 3, '0')
            FROM missing_codes
            WHERE employee."id" = missing_codes."id"
        `);

        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "employeeCode" SET NOT NULL`);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
                    JOIN pg_attribute ON pg_attribute.attrelid = pg_class.oid
                        AND pg_attribute.attnum = ANY(pg_constraint.conkey)
                    WHERE pg_class.relname = 'employees'
                        AND pg_constraint.contype = 'u'
                        AND pg_attribute.attname = 'employeeCode'
                ) THEN
                    ALTER TABLE "employees"
                    ADD CONSTRAINT "UQ_employees_employeeCode" UNIQUE ("employeeCode");
                END IF;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasEmployeesTable = await queryRunner.hasTable("employees");
        if (!hasEmployeesTable) {
            return;
        }

        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "UQ_employees_employeeCode"`);

        const hasEmployeeCodeColumn = await queryRunner.hasColumn("employees", "employeeCode");
        if (hasEmployeeCodeColumn) {
            await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "employeeCode"`);
        }
    }
}
