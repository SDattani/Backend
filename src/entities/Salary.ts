import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Employee } from "./Employee";

@Entity("salaries")
export class Salary {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    employeeId!: string;

    @ManyToOne(() => Employee, (employee) => employee.salaries)
    @JoinColumn({ name: "employeeId" })
    employee!: Employee;

    @Column("decimal", { precision: 10, scale: 2 })
    basicPay!: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    hra?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    da?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    ta?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    medicalAllowance?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    specialAllowance?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    bonus?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    overtimePay?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    pfContribution?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    esiContribution?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    professionalTax?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    incomeTax?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    loanRepayment?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    otherDeductions?: number;

    @Column("decimal", { precision: 10, scale: 2 })
    grossSalary!: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    totalDeductions!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    netSalary!: number;

    @Column({ type: "date" })
    effectiveDate!: Date;

    @Column("decimal", { precision: 5, scale: 2, nullable: true })
    lastIncrementPercentage?: number;

    @Column({ type: "date", nullable: true })
    lastIncrementDate?: Date;

    @Column({ default: "Active" })
    status!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}