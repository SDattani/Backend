"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeepOnlyAdminUsers1778506100000 = void 0;
class KeepOnlyAdminUsers1778506100000 {
    name = "KeepOnlyAdminUsers1778506100000";
    async up(queryRunner) {
        const hasUsersTable = await queryRunner.hasTable("users");
        if (!hasUsersTable) {
            return;
        }
        await queryRunner.query(`DELETE FROM "users" WHERE "role" <> 'ADMIN'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ADMIN'`);
    }
    async down(queryRunner) {
        const hasUsersTable = await queryRunner.hasTable("users");
        if (!hasUsersTable) {
            return;
        }
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'`);
    }
}
exports.KeepOnlyAdminUsers1778506100000 = KeepOnlyAdminUsers1778506100000;
