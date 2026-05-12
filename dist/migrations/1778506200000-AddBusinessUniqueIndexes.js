"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBusinessUniqueIndexes1778506200000 = void 0;
class AddBusinessUniqueIndexes1778506200000 {
    name = "AddBusinessUniqueIndexes1778506200000";
    async up(queryRunner) {
        await queryRunner.query(`
            WITH ranked AS (
                SELECT "id", ROW_NUMBER() OVER (PARTITION BY "phone" ORDER BY "createdAt", "id") AS row_number
                FROM "employees"
                WHERE "phone" IS NOT NULL AND "phone" <> ''
            )
            UPDATE "employees" employee
            SET "phone" = employee."phone" || '-' || ranked.row_number
            FROM ranked
            WHERE employee."id" = ranked."id"
                AND ranked.row_number > 1
        `);
        for (const column of ["pan", "aadhaar", "bankAccount"]) {
            await queryRunner.query(`
                WITH ranked AS (
                    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "${column}" ORDER BY "createdAt", "id") AS row_number
                    FROM "employees"
                    WHERE "${column}" IS NOT NULL AND "${column}" <> ''
                )
                UPDATE "employees" employee
                SET "${column}" = NULL
                FROM ranked
                WHERE employee."id" = ranked."id"
                    AND ranked.row_number > 1
            `);
        }
        await queryRunner.query(`
            WITH ranked AS (
                SELECT "id", ROW_NUMBER() OVER (PARTITION BY "username" ORDER BY "createdAt", "id") AS row_number
                FROM "users"
                WHERE "username" IS NOT NULL AND "username" <> ''
            )
            UPDATE "users" user_record
            SET "username" = user_record."username" || '_' || ranked.row_number
            FROM ranked
            WHERE user_record."id" = ranked."id"
                AND ranked.row_number > 1
        `);
        await queryRunner.query(`
            WITH ranked AS (
                SELECT "id", ROW_NUMBER() OVER (PARTITION BY "employeeId", "date" ORDER BY "createdAt", "id") AS row_number
                FROM "attendance"
            )
            DELETE FROM "attendance"
            USING ranked
            WHERE "attendance"."id" = ranked."id"
                AND ranked.row_number > 1
        `);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_employeecode_key"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "employeecode"`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employees_phone" ON "employees" ("phone")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employees_pan_present" ON "employees" ("pan") WHERE "pan" IS NOT NULL AND "pan" <> ''`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employees_aadhaar_present" ON "employees" ("aadhaar") WHERE "aadhaar" IS NOT NULL AND "aadhaar" <> ''`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employees_bankAccount_present" ON "employees" ("bankAccount") WHERE "bankAccount" IS NOT NULL AND "bankAccount" <> ''`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_username" ON "users" ("username")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_attendance_employee_date" ON "attendance" ("employeeId", "date")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_attendance_employee_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_username"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_employees_bankAccount_present"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_employees_aadhaar_present"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_employees_pan_present"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_employees_phone"`);
    }
}
exports.AddBusinessUniqueIndexes1778506200000 = AddBusinessUniqueIndexes1778506200000;
