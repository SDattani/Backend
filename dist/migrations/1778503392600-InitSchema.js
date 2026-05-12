"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitSchema1778503392600 = void 0;
class InitSchema1778503392600 {
    name = 'InitSchema1778503392600';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "salaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employeeId" uuid NOT NULL, "basicPay" numeric(10,2) NOT NULL, "hra" numeric(10,2), "da" numeric(10,2), "ta" numeric(10,2), "medicalAllowance" numeric(10,2), "specialAllowance" numeric(10,2), "bonus" numeric(10,2), "overtimePay" numeric(10,2), "pfContribution" numeric(10,2), "esiContribution" numeric(10,2), "professionalTax" numeric(10,2), "incomeTax" numeric(10,2), "loanRepayment" numeric(10,2), "otherDeductions" numeric(10,2), "grossSalary" numeric(10,2) NOT NULL, "totalDeductions" numeric(10,2) NOT NULL DEFAULT '0', "netSalary" numeric(10,2) NOT NULL, "effectiveDate" date NOT NULL, "lastIncrementPercentage" numeric(5,2), "lastIncrementDate" date, "status" character varying NOT NULL DEFAULT 'Active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_20ca60aa8d4201c7bcb430fdb36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "increments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employeeId" uuid NOT NULL, "incrementPercentage" numeric(5,2) NOT NULL, "incrementDate" date NOT NULL, "oldBasicPay" numeric(10,2) NOT NULL, "newBasicPay" numeric(10,2) NOT NULL, "reason" character varying, "approvedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c852ad74b11f6ddcb1c25be7e64" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('Present', 'Absent', 'Leave', 'Half Day')`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employeeId" uuid NOT NULL, "date" date NOT NULL, "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'Present', "checkInTime" TIME, "checkOutTime" TIME, "remarks" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employeeCode" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "designation" character varying NOT NULL, "department" character varying NOT NULL, "dateOfJoining" date NOT NULL, "status" character varying NOT NULL DEFAULT 'Active', "pan" character varying, "aadhaar" character varying, "bankAccount" character varying, "bankIFSC" character varying, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e3d0372d1ebe64cf827743666ce" UNIQUE ("employeeCode"), CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"), CONSTRAINT "UQ_737991e10350d9626f592894cef" UNIQUE ("userId"), CONSTRAINT "REL_737991e10350d9626f592894ce" UNIQUE ("userId"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "salaries" ADD CONSTRAINT "FK_46a9b162964c14cb310140da0d7" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "increments" ADD CONSTRAINT "FK_1c592ebaa349bc3f1ded1d6068a" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_07731c02b0333dc9b2678f98213" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_737991e10350d9626f592894cef" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_737991e10350d9626f592894cef"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_07731c02b0333dc9b2678f98213"`);
        await queryRunner.query(`ALTER TABLE "increments" DROP CONSTRAINT "FK_1c592ebaa349bc3f1ded1d6068a"`);
        await queryRunner.query(`ALTER TABLE "salaries" DROP CONSTRAINT "FK_46a9b162964c14cb310140da0d7"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP TABLE "increments"`);
        await queryRunner.query(`DROP TABLE "salaries"`);
    }
}
exports.InitSchema1778503392600 = InitSchema1778503392600;
