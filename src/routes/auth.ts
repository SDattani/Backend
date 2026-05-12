import { Router } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User, Role } from "../entities/User";
import { setAuthCookie } from "../middleware/auth";

const router = Router();

const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;

const toSafeUser = (user: User) => {
    const { password, ...safeUser } = user;
    return safeUser;
};

router.post("/register", async (req, res) => {
    try {
        if (!ADMIN_SETUP_SECRET || ADMIN_SETUP_SECRET.length < 16) {
            return res.status(503).json({ error: "Admin registration is not configured" });
        }

        const setupSecret = req.headers["x-admin-setup-secret"];
        if (setupSecret !== ADMIN_SETUP_SECRET) {
            return res.status(403).json({ error: "Invalid admin setup secret" });
        }

        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const userRepo = AppDataSource.getRepository(User);
        const existing = await userRepo.findOne({ where: { email } });
        if (existing) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = userRepo.create({
            email,
            username,
            password: hashedPassword,
            role: Role.ADMIN,
        });
        await userRepo.save(user);

        const token = setAuthCookie(res, { id: user.id, email: user.email, role: user.role });
        res.status(201).json({ message: "Admin registered", token, user: toSafeUser(user) });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "An unknown error occurred" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = setAuthCookie(res, { id: user.id, email: user.email, role: user.role });
        res.json({ message: "Login successful", user: toSafeUser(user) });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "An unknown error occurred" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("auth_token");
    res.json({ message: "Logged out successfully" });
});

export default router;
