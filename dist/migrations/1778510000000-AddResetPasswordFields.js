"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddResetPasswordFields1778510000000 = void 0;
class AddResetPasswordFields1778510000000 {
    name = "AddResetPasswordFields1778510000000";
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.AddResetPasswordFields1778510000000 = AddResetPasswordFields1778510000000;
