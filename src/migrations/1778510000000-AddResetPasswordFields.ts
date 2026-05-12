import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetPasswordFields1778510000000 implements MigrationInterface {
    name = "AddResetPasswordFields1778510000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUsersTable = await queryRunner.hasTable("users");
        if (!hasUsersTable) {
            return;
        }

        const hasResetTokenColumn = await queryRunner.hasColumn("users", "resetPasswordToken");
        if (!hasResetTokenColumn) {
            await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordToken" character varying`);
        }

        const hasResetExpiresColumn = await queryRunner.hasColumn("users", "resetPasswordExpiresAt");
        if (!hasResetExpiresColumn) {
            await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordExpiresAt" timestamp with time zone`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasUsersTable = await queryRunner.hasTable("users");
        if (!hasUsersTable) {
            return;
        }

        const hasResetExpiresColumn = await queryRunner.hasColumn("users", "resetPasswordExpiresAt");
        if (hasResetExpiresColumn) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordExpiresAt"`);
        }

        const hasResetTokenColumn = await queryRunner.hasColumn("users", "resetPasswordToken");
        if (hasResetTokenColumn) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordToken"`);
        }
    }
}
