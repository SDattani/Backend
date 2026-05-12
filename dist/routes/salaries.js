"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Salary_1 = require("../entities/Salary");
const Increment_1 = require("../entities/Increment");
const Employee_1 = require("../entities/Employee");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const findEmployeeByCode = async (employeeCode) => {
    const employeeRepo = data_source_1.AppDataSource.getRepository(Employee_1.Employee);
    return employeeRepo.findOne({ where: { employeeCode } });
};
// Get all salaries
router.get("/", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const salaryRepo = data_source_1.AppDataSource.getRepository(Salary_1.Salary);
        const salaries = await salaryRepo.find({
            relations: ["employee"],
            order: { createdAt: "DESC" }
        });
        res.json(salaries.map((salary) => ({
            employeeCode: salary.employee.employeeCode,
            employeeName: `${salary.employee.firstName} ${salary.employee.lastName}`,
            basicPay: salary.basicPay,
            grossSalary: salary.grossSalary,
            totalDeductions: salary.totalDeductions,
            netSalary: salary.netSalary,
            effectiveDate: salary.effectiveDate,
            status: salary.status
        })));
    }
    catch (err) {
        console.error("Get salaries error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Get salary for specific employee by employee code
router.get("/employee/:employeeCode", auth_1.authenticateToken, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const salaryRepo = data_source_1.AppDataSource.getRepository(Salary_1.Salary);
        const salaries = await salaryRepo.find({
            where: { employeeId: employee.id },
            order: { effectiveDate: "DESC" }
        });
        if (salaries.length === 0) {
            return res.status(404).json({ error: "No salary records found for this employee" });
        }
        res.json(salaries);
    }
    catch (err) {
        console.error("Get employee salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Create salary for employee
router.post("/", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const { employeeCode, basicPay, hra, da, ta, medicalAllowance, specialAllowance, bonus, overtimePay, pfContribution, esiContribution, professionalTax, incomeTax, loanRepayment, otherDeductions, effectiveDate } = req.body;
        if (!employeeCode || !basicPay) {
            return res.status(400).json({ error: "Employee code and basic pay are required" });
        }
        const employee = await findEmployeeByCode(employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        // Calculate totals
        const grossSalary = Number(basicPay) +
            (Number(hra) || 0) +
            (Number(da) || 0) +
            (Number(ta) || 0) +
            (Number(medicalAllowance) || 0) +
            (Number(specialAllowance) || 0) +
            (Number(bonus) || 0) +
            (Number(overtimePay) || 0);
        const totalDeductions = (Number(pfContribution) || 0) +
            (Number(esiContribution) || 0) +
            (Number(professionalTax) || 0) +
            (Number(incomeTax) || 0) +
            (Number(loanRepayment) || 0) +
            (Number(otherDeductions) || 0);
        const netSalary = grossSalary - totalDeductions;
        const salaryRepo = data_source_1.AppDataSource.getRepository(Salary_1.Salary);
        const salary = salaryRepo.create({
            employeeId: employee.id,
            basicPay,
            hra,
            da,
            ta,
            medicalAllowance,
            specialAllowance,
            bonus,
            overtimePay,
            pfContribution,
            esiContribution,
            professionalTax,
            incomeTax,
            loanRepayment,
            otherDeductions,
            grossSalary,
            totalDeductions,
            netSalary,
            effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
            status: "Active"
        });
        await salaryRepo.save(salary);
        res.status(201).json({
            message: "Salary created successfully",
            salary
        });
    }
    catch (err) {
        console.error("Create salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Apply increment to employee salary by employee code
router.post("/increment/:employeeCode", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const { percentage, reason } = req.body;
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        if (!percentage || percentage <= 0) {
            return res.status(400).json({ error: "Valid increment percentage is required" });
        }
        const salaryRepo = data_source_1.AppDataSource.getRepository(Salary_1.Salary);
        const incrementRepo = data_source_1.AppDataSource.getRepository(Increment_1.Increment);
        // Get the latest active salary
        const salaries = await salaryRepo.find({
            where: { employeeId: employee.id, status: "Active" },
            order: { effectiveDate: "DESC" }
        });
        if (salaries.length === 0) {
            return res.status(404).json({ error: "No active salary record found for this employee" });
        }
        const currentSalary = salaries[0];
        // Store old basic pay BEFORE calculation
        const oldBasicPay = Number(currentSalary.basicPay);
        // Calculate new basic pay
        const newBasicPay = oldBasicPay * (1 + Number(percentage) / 100);
        // Update salary record
        currentSalary.basicPay = newBasicPay;
        // Recalculate other components based on new basic pay
        const hraAmount = currentSalary.hra || newBasicPay * 0.4;
        const daAmount = currentSalary.da || newBasicPay * 0.3;
        currentSalary.grossSalary =
            newBasicPay +
                (Number(hraAmount) || 0) +
                (Number(daAmount) || 0) +
                (Number(currentSalary.ta) || 0) +
                (Number(currentSalary.medicalAllowance) || 0) +
                (Number(currentSalary.specialAllowance) || 0) +
                (Number(currentSalary.bonus) || 0) +
                (Number(currentSalary.overtimePay) || 0);
        currentSalary.totalDeductions =
            (Number(currentSalary.pfContribution) || 0) +
                (Number(currentSalary.esiContribution) || 0) +
                (Number(currentSalary.professionalTax) || 0) +
                (Number(currentSalary.incomeTax) || 0) +
                (Number(currentSalary.loanRepayment) || 0) +
                (Number(currentSalary.otherDeductions) || 0);
        currentSalary.netSalary = currentSalary.grossSalary - currentSalary.totalDeductions;
        currentSalary.lastIncrementPercentage = Number(percentage);
        currentSalary.lastIncrementDate = new Date();
        await salaryRepo.save(currentSalary);
        // Create increment record with correct old and new values
        const increment = incrementRepo.create({
            employeeId: employee.id,
            incrementPercentage: Number(percentage),
            incrementDate: new Date(),
            oldBasicPay, // This is the OLD value before increment
            newBasicPay, // This is the NEW value after increment
            reason,
            approvedBy: req.user?.email,
        });
        await incrementRepo.save(increment);
        res.json({
            message: "Increment applied successfully",
            salary: currentSalary,
            increment
        });
    }
    catch (err) {
        console.error("Apply increment error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Get increment history for employee by employee code
router.get("/increments/:employeeCode", auth_1.authenticateToken, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const incrementRepo = data_source_1.AppDataSource.getRepository(Increment_1.Increment);
        const increments = await incrementRepo.find({
            where: { employeeId: employee.id },
            order: { incrementDate: "DESC" }
        });
        res.json(increments);
    }
    catch (err) {
        console.error("Get increments error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Update latest active salary by employee code
router.put("/employee/:employeeCode", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        const salaryRepo = data_source_1.AppDataSource.getRepository(Salary_1.Salary);
        const salaries = await salaryRepo.find({
            where: { employeeId: employee.id, status: "Active" },
            order: { effectiveDate: "DESC" }
        });
        if (salaries.length === 0) {
            return res.status(404).json({ error: "No active salary record found for this employee" });
        }
        const salary = salaries[0];
        const updateFields = [
            'basicPay', 'hra', 'da', 'ta', 'medicalAllowance',
            'specialAllowance', 'bonus', 'overtimePay', 'pfContribution',
            'esiContribution', 'professionalTax', 'incomeTax',
            'loanRepayment', 'otherDeductions', 'status'
        ];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                salary[field] = req.body[field];
            }
        });
        salary.grossSalary =
            Number(salary.basicPay) +
                (Number(salary.hra) || 0) +
                (Number(salary.da) || 0) +
                (Number(salary.ta) || 0) +
                (Number(salary.medicalAllowance) || 0) +
                (Number(salary.specialAllowance) || 0) +
                (Number(salary.bonus) || 0) +
                (Number(salary.overtimePay) || 0);
        salary.totalDeductions =
            (Number(salary.pfContribution) || 0) +
                (Number(salary.esiContribution) || 0) +
                (Number(salary.professionalTax) || 0) +
                (Number(salary.incomeTax) || 0) +
                (Number(salary.loanRepayment) || 0) +
                (Number(salary.otherDeductions) || 0);
        salary.netSalary = salary.grossSalary - salary.totalDeductions;
        await salaryRepo.save(salary);
        res.json({
            message: "Salary updated successfully",
            salary
        });
    }
    catch (err) {
        console.error("Update employee salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
// Update salary
router.put("/:id", auth_1.authenticateToken, auth_1.isAdmin, async (req, res) => {
    try {
        const salaryRepo = data_source_1.AppDataSource.getRepository(Salary_1.Salary);
        const salary = await salaryRepo.findOne({ where: { id: req.params.id } });
        if (!salary) {
            return res.status(404).json({ error: "Salary record not found" });
        }
        // Update fields
        const updateFields = [
            'basicPay', 'hra', 'da', 'ta', 'medicalAllowance',
            'specialAllowance', 'bonus', 'overtimePay', 'pfContribution',
            'esiContribution', 'professionalTax', 'incomeTax',
            'loanRepayment', 'otherDeductions', 'status'
        ];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                salary[field] = req.body[field];
            }
        });
        // Recalculate totals
        salary.grossSalary =
            Number(salary.basicPay) +
                (Number(salary.hra) || 0) +
                (Number(salary.da) || 0) +
                (Number(salary.ta) || 0) +
                (Number(salary.medicalAllowance) || 0) +
                (Number(salary.specialAllowance) || 0) +
                (Number(salary.bonus) || 0) +
                (Number(salary.overtimePay) || 0);
        salary.totalDeductions =
            (Number(salary.pfContribution) || 0) +
                (Number(salary.esiContribution) || 0) +
                (Number(salary.professionalTax) || 0) +
                (Number(salary.incomeTax) || 0) +
                (Number(salary.loanRepayment) || 0) +
                (Number(salary.otherDeductions) || 0);
        salary.netSalary = salary.grossSalary - salary.totalDeductions;
        await salaryRepo.save(salary);
        res.json({
            message: "Salary updated successfully",
            salary
        });
    }
    catch (err) {
        console.error("Update salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});
exports.default = router;
