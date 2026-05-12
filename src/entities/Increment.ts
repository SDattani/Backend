import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Employee } from "./Employee";

@Entity("increments")
export class Increment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    employeeId!: string;

    @ManyToOne(() => Employee, (employee) => employee.increments)
    @JoinColumn({ name: "employeeId" })
    employee!: Employee;

    @Column("decimal", { precision: 5, scale: 2 })
    incrementPercentage!: number;

    @Column({ type: "date" })
    incrementDate!: Date;

    @Column("decimal", { precision: 10, scale: 2 })
    oldBasicPay!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    newBasicPay!: number;

    @Column({ nullable: true })
    reason?: string;

    @Column({ nullable: true })
    approvedBy?: string;

    @CreateDateColumn()
    createdAt!: Date;
}