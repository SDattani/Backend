"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
require("dotenv/config");
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const Employee_1 = require("./entities/Employee");
const Salary_1 = require("./entities/Salary");
const Increment_1 = require("./entities/Increment");
const Attendance_1 = require("./entities/Attendance");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false, // Always use migrations in production
    logging: process.env.NODE_ENV === "development",
    entities: [User_1.User, Employee_1.Employee, Salary_1.Salary, Increment_1.Increment, Attendance_1.Attendance],
    migrations: [__dirname + "/migrations/*.{js,ts}"],
    subscribers: [],
});
