import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Employee } from "./entities/Employee";
import { Salary } from "./entities/Salary";
import { Increment } from "./entities/Increment";
import { Attendance } from "./entities/Attendance";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false, // Always use migrations in production
    logging: process.env.NODE_ENV === "development",
    entities: [User, Employee, Salary, Increment, Attendance],
    migrations: [__dirname + "/migrations/*.{js,ts}"],
    subscribers: [],
});