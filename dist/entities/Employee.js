"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
const typeorm_1 = require("typeorm");
const Salary_1 = require("./Salary");
const Increment_1 = require("./Increment");
const Attendance_1 = require("./Attendance");
let Employee = class Employee {
    id;
    employeeCode;
    firstName;
    lastName;
    email;
    phone;
    designation;
    department;
    dateOfJoining;
    status;
    pan;
    aadhaar;
    bankAccount;
    bankIFSC;
    createdAt;
    updatedAt;
    salaries;
    increments;
    attendance;
};
exports.Employee = Employee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Employee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "employeeCode", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Employee.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Employee.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Employee.prototype, "designation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Employee.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], Employee.prototype, "dateOfJoining", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "Active" }),
    __metadata("design:type", String)
], Employee.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "pan", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "aadhaar", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "bankAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "bankIFSC", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Employee.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Employee.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Salary_1.Salary, (salary) => salary.employee),
    __metadata("design:type", Array)
], Employee.prototype, "salaries", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Increment_1.Increment, (increment) => increment.employee),
    __metadata("design:type", Array)
], Employee.prototype, "increments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Attendance_1.Attendance, (attendance) => attendance.employee),
    __metadata("design:type", Array)
], Employee.prototype, "attendance", void 0);
exports.Employee = Employee = __decorate([
    (0, typeorm_1.Entity)("employees"),
    (0, typeorm_1.Index)("UQ_employees_pan_present", ["pan"], { unique: true, where: "\"pan\" IS NOT NULL AND \"pan\" <> ''" }),
    (0, typeorm_1.Index)("UQ_employees_aadhaar_present", ["aadhaar"], { unique: true, where: "\"aadhaar\" IS NOT NULL AND \"aadhaar\" <> ''" }),
    (0, typeorm_1.Index)("UQ_employees_bankAccount_present", ["bankAccount"], { unique: true, where: "\"bankAccount\" IS NOT NULL AND \"bankAccount\" <> ''" })
], Employee);
