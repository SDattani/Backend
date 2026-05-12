import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Employee } from "./Employee";

export enum AttendanceStatus {
    PRESENT = "Present",
    ABSENT = "Absent",
    LEAVE = "Leave",
    HALF_DAY = "Half Day",
}

@Entity("attendance")
@Index("UQ_attendance_employee_date", ["employeeId", "date"], { unique: true })
export class Attendance {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    employeeId!: string;

    @ManyToOne(() => Employee, (employee) => employee.attendance)
    @JoinColumn({ name: "employeeId" })
    employee!: Employee;

    @Column({ type: "date" })
    date!: Date;

    @Column({
        type: "enum",
        enum: AttendanceStatus,
        default: AttendanceStatus.PRESENT,
    })
    status!: AttendanceStatus;

    @Column({ type: "time", nullable: true })
    checkInTime?: string;

    @Column({ type: "time", nullable: true })
    checkOutTime?: string;

    @Column({ nullable: true })
    remarks?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
