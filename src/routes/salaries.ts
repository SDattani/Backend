import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Salary } from "../entities/Salary";
import { Increment } from "../entities/Increment";
import { Employee } from "../entities/Employee";
import { authenticateToken, isAdmin } from "../middleware/auth";

const router = Router();

const findEmployeeByCode = async (employeeCode: string) => {
    const employeeRepo = AppDataSource.getRepository(Employee);
    return employeeRepo.findOne({ where: { employeeCode } });
};

// Get all salaries
router.get("/", authenticateToken, isAdmin, async (req, res) => {
    try {
        const salaryRepo = AppDataSource.getRepository(Salary);
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
    } catch (err) {
        console.error("Get salaries error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Get salary for specific employee by employee code
router.get("/employee/:employeeCode", authenticateToken, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode as string);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const salaryRepo = AppDataSource.getRepository(Salary);
        const salaries = await salaryRepo.find({
            where: { employeeId: employee.id },
            order: { effectiveDate: "DESC" }
        });

        if (salaries.length === 0) {
            return res.status(404).json({ error: "No salary records found for this employee" });
        }

        res.json(salaries);
    } catch (err) {
        console.error("Get employee salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Create salary for employee
router.post("/", authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            employeeCode,
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
            effectiveDate
        } = req.body;

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

        const totalDeductions =
            (Number(pfContribution) || 0) +
            (Number(esiContribution) || 0) +
            (Number(professionalTax) || 0) +
            (Number(incomeTax) || 0) +
            (Number(loanRepayment) || 0) +
            (Number(otherDeductions) || 0);

        const netSalary = grossSalary - totalDeductions;

        const salaryRepo = AppDataSource.getRepository(Salary);
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
    } catch (err) {
        console.error("Create salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Apply increment to employee salary by employee code
router.post("/increment/:employeeCode", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { percentage, reason } = req.body;
        const employee = await findEmployeeByCode(req.params.employeeCode as string);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        if (!percentage || percentage <= 0 || percentage >= 100 ) {
            return res.status(400).json({ error: "Valid increment percentage is required" });
        }

        const salaryRepo = AppDataSource.getRepository(Salary);
        const incrementRepo = AppDataSource.getRepository(Increment);

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
    } catch (err) {
        console.error("Apply increment error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Get increment history for employee by employee code
router.get("/increments/:employeeCode", authenticateToken, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode as string);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const incrementRepo = AppDataSource.getRepository(Increment);
        const increments = await incrementRepo.find({
            where: { employeeId: employee.id },
            order: { incrementDate: "DESC" }
        });
        res.json(increments);
    } catch (err) {
        console.error("Get increments error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Update latest active salary by employee code
router.put("/employee/:employeeCode", authenticateToken, isAdmin, async (req, res) => {
    try {
        const employee = await findEmployeeByCode(req.params.employeeCode as string);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const salaryRepo = AppDataSource.getRepository(Salary);
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
                (salary as any)[field] = req.body[field];
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
    } catch (err) {
        console.error("Update employee salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Update salary
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const salaryRepo = AppDataSource.getRepository(Salary);
        const salary = await salaryRepo.findOne({ where: { id: req.params.id as string } });

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
                (salary as any)[field] = req.body[field];
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
    } catch (err) {
        console.error("Update salary error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

export default router;
