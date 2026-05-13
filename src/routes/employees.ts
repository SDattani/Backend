import { Router } from "express";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Employee } from "../entities/Employee";
import { Salary } from "../entities/Salary";
import { authenticateToken, isAdmin } from "../middleware/auth";

const router = Router();
const EMPLOYEE_CODE_PREFIX = "TX";
const EMPLOYEE_CODE_PAD_LENGTH = 3;

const generateNextEmployeeCode = async (employeeRepo: Repository<Employee>) => {
    const latestEmployee = await employeeRepo
        .createQueryBuilder("employee")
        .select("employee.employeeCode", "employeeCode")
        .where("employee.employeeCode ~ :pattern", { pattern: `^${EMPLOYEE_CODE_PREFIX}-[0-9]+$` })
        .orderBy(`CAST(SUBSTRING(employee.employeeCode FROM ${EMPLOYEE_CODE_PREFIX.length + 2}) AS integer)`, "DESC")
        .limit(1)
        .getRawOne<{ employeeCode: string }>();

    const lastEmployeeNumber = latestEmployee?.employeeCode
        ? Number(latestEmployee.employeeCode.split("-")[1])
        : 0;
    const nextEmployeeNumber = Number.isFinite(lastEmployeeNumber) ? lastEmployeeNumber + 1 : 1;

    return `${EMPLOYEE_CODE_PREFIX}-${String(nextEmployeeNumber).padStart(EMPLOYEE_CODE_PAD_LENGTH, "0")}`;
};

const isEmployeeCodeConflict = (err: unknown) => {
    const dbError = err as { code?: string; detail?: string; message?: string };
    return dbError.code === "23505" && `${dbError.detail ?? dbError.message ?? ""}`.includes("employeeCode");
};

// Get all employees
router.get("/", authenticateToken, isAdmin, async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employees = await employeeRepo.find({
            relations: ["salaries"],
            order: { createdAt: "DESC" }
        });
        res.json(employees);
    } catch (err) {
        console.error("Get employees error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Get employee by employee code
router.get("/code/:employeeCode", authenticateToken, async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({
            where: { employeeCode: req.params.employeeCode as string },
            relations: ["salaries", "increments", "attendance"]
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(employee);
    } catch (err) {
        console.error("Get employee error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Update employee by employee code
router.put("/code/:employeeCode", authenticateToken, isAdmin, async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({
            where: { employeeCode: req.params.employeeCode as string }
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const updateFields = [
            'firstName', 'lastName', 'phone', 'designation',
            'department', 'status', 'pan', 'aadhaar',
            'bankAccount', 'bankIFSC'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                (employee as any)[field] = req.body[field];
            }
        });

        await employeeRepo.save(employee);

        const updatedEmployee = await employeeRepo.findOne({
            where: { employeeCode: req.params.employeeCode as string },
            relations: ["salaries"]
        });

        res.json({
            message: "Employee updated successfully",
            employee: updatedEmployee
        });
    } catch (err) {
        console.error("Update employee error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Delete employee by employee code (soft delete by changing status)
router.delete("/code/:employeeCode", authenticateToken, isAdmin, async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({
            where: { employeeCode: req.params.employeeCode as string}
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        employee.status = "Inactive";
        await employeeRepo.save(employee);

        res.json({ message: "Employee deactivated successfully" });
    } catch (err) {
        console.error("Delete employee error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Get single employee
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({
            where: { id: req.params.id as string },
            relations: ["salaries", "increments", "attendance"]
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(employee);
    } catch (err) {
        console.error("Get employee error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Create new employee (Admin only)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            designation,
            department,
            dateOfJoining,
            pan,
            aadhaar,
            bankAccount,
            bankIFSC,
            // Salary details
            basicPay,
            hra,
            da
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email ||
            !phone || !designation || !department || !dateOfJoining) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        let completeEmployee: Employee | null = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                completeEmployee = await AppDataSource.transaction(async (manager) => {
                    const employeeRepo = manager.getRepository(Employee);
                    const salaryRepo = manager.getRepository(Salary);

                    const existingEmployee = await employeeRepo.findOne({ where: { email } });
                    if (existingEmployee) {
                        const error = new Error("Employee with this email already exists") as Error & { statusCode: number };
                        error.statusCode = 400;
                        throw error;
                    }

                    const employeeCode = await generateNextEmployeeCode(employeeRepo);

                    // Create employee
                    const employee = employeeRepo.create({
                        firstName,
                        lastName,
                        email,
                        employeeCode,
                        phone,
                        designation,
                        department,
                        dateOfJoining: new Date(dateOfJoining),
                        pan,
                        aadhaar,
                        bankAccount,
                        bankIFSC,
                    });
                    await employeeRepo.save(employee);

                    // Create initial salary record if basicPay provided
                    if (basicPay) {
                        const basicPayAmount = Number(basicPay);
                        const hraAmount = hra || basicPayAmount * 0.4; // Default 40% of basic
                        const daAmount = da || basicPayAmount * 0.3; // Default 30% of basic
                        const grossSalary = basicPayAmount + Number(hraAmount) + Number(daAmount);
                        const pfContribution = basicPayAmount * 0.12; // 12% PF
                        const netSalary = grossSalary - pfContribution;

                        const salary = salaryRepo.create({
                            employeeId: employee.id,
                            basicPay: basicPayAmount,
                            hra: hraAmount,
                            da: daAmount,
                            grossSalary,
                            pfContribution,
                            totalDeductions: pfContribution,
                            netSalary,
                            effectiveDate: new Date(dateOfJoining),
                            status: "Active"
                        });
                        await salaryRepo.save(salary);
                    }

                    // Fetch complete employee data
                    return employeeRepo.findOne({
                        where: { id: employee.id },
                        relations: ["salaries"]
                    });
                });
                break;
            } catch (err) {
                if (isEmployeeCodeConflict(err) && attempt < 2) {
                    continue;
                }
                throw err;
            }
        }

        if (!completeEmployee) {
            return res.status(500).json({
                error: "Employee could not be created"
            });
        }

        res.status(201).json({
            message: "Employee created successfully",
            employee: completeEmployee
        });
    } catch (err) {
        console.error("Create employee error:", err);
        const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
        res.status(statusCode).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Update employee
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({
            where: { id: req.params.id as string }
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Update allowed fields
        const updateFields = [
            'firstName', 'lastName', 'phone', 'designation',
            'department', 'status', 'pan', 'aadhaar',
            'bankAccount', 'bankIFSC'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                (employee as any)[field] = req.body[field];
            }
        });

        await employeeRepo.save(employee);

        const updatedEmployee = await employeeRepo.findOne({
            where: { id: req.params.id as string},
            relations: ["salaries"]
        });

        res.json({
            message: "Employee updated successfully",
            employee: updatedEmployee
        });
    } catch (err) {
        console.error("Update employee error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

// Delete employee (soft delete by changing status)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({
            where: { id: req.params.id as string}
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        employee.status = "Inactive";
        await employeeRepo.save(employee);

        res.json({ message: "Employee deactivated successfully" });
    } catch (err) {
        console.error("Delete employee error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "An unknown error occurred"
        });
    }
});

export default router;