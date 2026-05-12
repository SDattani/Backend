import { MigrationInterface, QueryRunner } from "typeorm";

export class KeepOnlyAdminUsers1778506100000 implements MigrationInterface {
    name = "KeepOnlyAdminUsers1778506100000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUsersTable = await queryRunner.hasTable("users");
        if (!hasUsersTable) {
            return;
        }

        await queryRunner.query(`DELETE FROM "users" WHERE "role" <> 'ADMIN'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ADMIN'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasUsersTable = await queryRunner.hasTable("users");
        if (!hasUsersTable) {
            return;
        }

        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'`);
    }
}
