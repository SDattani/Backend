import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Salary } from "./Salary";
import { Increment } from "./Increment";
import { Attendance } from "./Attendance";

@Entity("employees")
@Index("UQ_employees_pan_present", ["pan"], { unique: true, where: "\"pan\" IS NOT NULL AND \"pan\" <> ''" })
@Index("UQ_employees_aadhaar_present", ["aadhaar"], { unique: true, where: "\"aadhaar\" IS NOT NULL AND \"aadhaar\" <> ''" })
@Index("UQ_employees_bankAccount_present", ["bankAccount"], { unique: true, where: "\"bankAccount\" IS NOT NULL AND \"bankAccount\" <> ''" })
export class Employee {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    employeeCode!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ unique: true })
    phone!: string;

    @Column()
    designation!: string;

    @Column()
    department!: string;

    @Column({ type: "date" })
    dateOfJoining!: Date;

    @Column({ default: "Active" })
    status!: string;

    @Column({ nullable: true })
    pan?: string;

    @Column({ nullable: true })
    aadhaar?: string;

    @Column({ nullable: true })
    bankAccount?: string;

    @Column({ nullable: true })
    bankIFSC?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Salary, (salary) => salary.employee)
    salaries!: Salary[];

    @OneToMany(() => Increment, (increment) => increment.employee)
    increments!: Increment[];

    @OneToMany(() => Attendance, (attendance) => attendance.employee)
    attendance!: Attendance[];
}
