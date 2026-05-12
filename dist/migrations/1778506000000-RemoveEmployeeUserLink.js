"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveEmployeeUserLink1778506000000 = void 0;
class RemoveEmployeeUserLink1778506000000 {
    name = "RemoveEmployeeUserLink1778506000000";
    async up(queryRunner) {
        const hasEmployeesTable = await queryRunner.hasTable("employees");
        if (!hasEmployeesTable) {
            return;
        }
        const hasUserIdColumn = await queryRunner.hasColumn("employees", "userId");
        if (!hasUserIdColumn) {
            return;
        }
        await queryRunner.query(`
            DO $$
            DECLARE
                constraint_record record;
            BEGIN
                FOR constraint_record IN
                    SELECT conname
                    FROM pg_constraint
                    WHERE conrelid = '"employees"'::regclass
                        AND conkey = ARRAY[
                            (
                                SELECT attnum
                                FROM pg_attribute
                                WHERE attrelid = '"employees"'::regclass
                                    AND attname = 'userId'
                            )
                        ]::smallint[]
                LOOP
                    EXECUTE format('ALTER TABLE "employees" DROP CONSTRAINT %I', constraint_record.conname);
                END LOOP;
            END
            $$;
        `);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "userId"`);
    }
    async down(queryRunner) {
        const hasEmployeesTable = await queryRunner.hasTable("employees");
        if (!hasEmployeesTable) {
            return;
        }
        const hasUserIdColumn = await queryRunner.hasColumn("employees", "userId");
        if (hasUserIdColumn) {
            return;
        }
        await queryRunner.query(`ALTER TABLE "employees" ADD "userId" uuid`);
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD CONSTRAINT "UQ_employees_userId" UNIQUE ("userId")
        `);
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD CONSTRAINT "FK_employees_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}
exports.RemoveEmployeeUserLink1778506000000 = RemoveEmployeeUserLink1778506000000;
