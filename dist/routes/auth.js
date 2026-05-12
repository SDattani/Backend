"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;
const toSafeUser = (user) => {
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
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const existing = await userRepo.findOne({ where: { email } });
        if (existing)
            return res.status(400).json({ error: "User already exists" });
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = userRepo.create({
            email,
            username,
            password: hashedPassword,
            role: User_1.Role.ADMIN,
        });
        await userRepo.save(user);
        const token = (0, auth_1.setAuthCookie)(res, { id: user.id, email: user.email, role: user.role });
        res.status(201).json({ message: "Admin registered", token, user: toSafeUser(user) });
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "An unknown error occurred" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { email } });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = (0, auth_1.setAuthCookie)(res, { id: user.id, email: user.email, role: user.role });
        res.json({ message: "Login successful", user: toSafeUser(user) });
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "An unknown error occurred" });
    }
});
router.post("/logout", (req, res) => {
    res.clearCookie("auth_token");
    res.json({ message: "Logged out successfully" });
});
exports.default = router;
