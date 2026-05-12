"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Attendance_1 = require("../entities/Attendance");
const Employee_1 = require("../entities/Employee");
const auth_1 = require("../middleware/auth");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
const findEmployeeByCode = async (employeeCode) => {
    const employeeRepo = data_source_1.AppDataSource.getRepository(Employee_1.Employee);
    return employeeRepo.findOne({ where: { employeeCode } });
};
// Get all attendance records (Admin only)
router.get("/", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.date = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
        }
        if (status) {
            whereClause.status = status;
        }
        const records = await attendanceRepo.find({
            where: whereClause,
            relations: ["employee"],
            order: { date: "DESC" }
        });
        res.json(records);
    }
    catch (err) {
        console.error("Get attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Get attendance for specific employee by employee code
router.get("/employee/:employeeCode", auth_1.authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        let whereClause = { employeeId: employee.id };
        if (startDate && endDate) {
            whereClause.date = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
        }
        const records = await attendanceRepo.find({
            where: whereClause,
            order: { date: "DESC" }
        });
        res.json(records);
    }
    catch (err) {
        console.error("Get employee attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Get attendance summary for employee by employee code
router.get("/employee/:employeeCode/summary", auth_1.authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0);
        const records = await attendanceRepo.find({
            where: {
                employeeId: employee.id,
                date: (0, typeorm_1.Between)(startDate, endDate)
            }
        });
        const summary = {
            totalDays: records.length,
            present: records.filter(r => r.status === Attendance_1.AttendanceStatus.PRESENT).length,
            absent: records.filter(r => r.status === Attendance_1.AttendanceStatus.ABSENT).length,
            leave: records.filter(r => r.status === Attendance_1.AttendanceStatus.LEAVE).length,
            halfDay: records.filter(r => r.status === Attendance_1.AttendanceStatus.HALF_DAY).length,
            month: targetMonth,
            year: targetYear
        };
        res.json(summary);
    }
    catch (err) {
        console.error("Get attendance summary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Create attendance record
router.post("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const { employeeCode, date, status, checkInTime, checkOutTime, remarks } = req.body;
        if (!employeeCode || !date) {
            return res.status(400).json({ error: "Employee code and date are required" });
        }
        const employee = await findEmployeeByCode(employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        // Check if attendance already exists for this date
        const existing = await attendanceRepo.findOne({
            where: {
                employeeId: employee.id,
                date: new Date(date)
            }
        });
        if (existing) {
            return res.status(400).json({ error: "Attendance already marked for this date" });
        }
        const attendance = attendanceRepo.create({
            employeeId: employee.id,
            date: new Date(date),
            status: status || Attendance_1.AttendanceStatus.PRESENT,
            checkInTime,
            checkOutTime,
            remarks
        });
        await attendanceRepo.save(attendance);
        res.status(201).json({
            message: "Attendance marked successfully",
            attendance
        });
    }
    catch (err) {
        console.error("Create attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Update attendance by employee code and date
router.put("/employee/:employeeCode/date/:date", auth_1.authenticateToken, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        const attendance = await attendanceRepo.findOne({
            where: {
                employeeId: employee.id,
                date: new Date(req.params.date)
            }
        });
        if (!attendance) {
            return res.status(404).json({ error: "Attendance record not found" });
        }
        const { status, checkInTime, checkOutTime, remarks } = req.body;
        if (status)
            attendance.status = status;
        if (checkInTime !== undefined)
            attendance.checkInTime = checkInTime;
        if (checkOutTime !== undefined)
            attendance.checkOutTime = checkOutTime;
        if (remarks !== undefined)
            attendance.remarks = remarks;
        await attendanceRepo.save(attendance);
        res.json({
            message: "Attendance updated successfully",
            attendance
        });
    }
    catch (err) {
        console.error("Update attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Delete attendance by employee code and date
router.delete("/employee/:employeeCode/date/:date", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        const attendance = await attendanceRepo.findOne({
            where: {
                employeeId: employee.id,
                date: new Date(req.params.date)
            }
        });
        if (!attendance) {
            return res.status(404).json({ error: "Attendance record not found" });
        }
        await attendanceRepo.remove(attendance);
        res.json({ message: "Attendance record deleted successfully" });
    }
    catch (err) {
        console.error("Delete attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Update attendance record
router.put("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        const attendance = await attendanceRepo.findOne({
            where: { id: req.params.id }
        });
        if (!attendance) {
            return res.status(404).json({ error: "Attendance record not found" });
        }
        const { status, checkInTime, checkOutTime, remarks } = req.body;
        if (status)
            attendance.status = status;
        if (checkInTime !== undefined)
            attendance.checkInTime = checkInTime;
        if (checkOutTime !== undefined)
            attendance.checkOutTime = checkOutTime;
        if (remarks !== undefined)
            attendance.remarks = remarks;
        await attendanceRepo.save(attendance);
        res.json({
            message: "Attendance updated successfully",
            attendance
        });
    }
    catch (err) {
        console.error("Update attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Delete attendance record
router.delete("/:id", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        const attendance = await attendanceRepo.findOne({
            where: { id: req.params.id }
        });
        if (!attendance) {
            return res.status(404).json({ error: "Attendance record not found" });
        }
        await attendanceRepo.remove(attendance);
        res.json({ message: "Attendance record deleted successfully" });
    }
    catch (err) {
        console.error("Delete attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Bulk create attendance records
router.post("/bulk", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: "Records array is required" });
        }
        const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        const createdRecords = [];
        for (const record of records) {
            const { employeeCode, date, status, checkInTime, checkOutTime, remarks } = record;
            if (!employeeCode || !date)
                continue;
            const employee = await findEmployeeByCode(employeeCode);
            if (!employee)
                continue;
            // Check if already exists
            const existing = await attendanceRepo.findOne({
                where: {
                    employeeId: employee.id,
                    date: new Date(date)
                }
            });
            if (existing)
                continue;
            const attendance = attendanceRepo.create({
                employeeId: employee.id,
                date: new Date(date),
                status: status || Attendance_1.AttendanceStatus.PRESENT,
                checkInTime,
                checkOutTime,
                remarks
            });
            await attendanceRepo.save(attendance);
            createdRecords.push(attendance);
        }
        res.status(201).json({
            message: `${createdRecords.length} attendance records created successfully`,
            records: createdRecords
        });
    }
    catch (err) {
        console.error("Bulk create attendance error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
exports.default = router;
