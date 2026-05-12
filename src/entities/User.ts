import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum Role {
    ADMIN = "ADMIN",
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Column({
        type: "enum",
        enum: Role,
        default: Role.ADMIN,
    })
    role!: Role;

    @Column({ nullable: true })
    resetPasswordToken?: string;

    @Column({ type: "timestamptz", nullable: true })
    resetPasswordExpiresAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
