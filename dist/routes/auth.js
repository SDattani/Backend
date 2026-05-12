"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const auth_1 = require("../middleware/auth");
const password_1 = require("../utils/password");
const router = (0, express_1.Router)();
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;
const RESET_TOKEN_EXPIRY_MINUTES = 15;
const toSafeUser = (user) => {
    const { password, resetPasswordToken, resetPasswordExpiresAt, ...safeUser } = user;
    return safeUser;
};
// POST /auth/register — only allows first admin
router.post("/register", async (req, res) => {
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const adminCount = await userRepo.count({ where: { role: User_1.Role.ADMIN } });
        if (adminCount > 0) {
            return res.status(403).json({ error: "Admin already exists. Only one admin is allowed." });
        }
        if (!ADMIN_SETUP_SECRET || ADMIN_SETUP_SECRET.length < 16) {
            return res.status(503).json({ error: "Admin registration is not configured" });
        }
        const setupSecret = req.headers["x-admin-setup-secret"];
        if (setupSecret !== ADMIN_SETUP_SECRET) {
            return res.status(403).json({ error: "Invalid admin setup secret" });
        }
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ error: "Missing required fields: email, password, username" });
        }
        const validation = (0, password_1.validatePassword)(password);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join("; ") });
        }
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
// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
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
// POST /auth/logout
router.post("/logout", (_req, res) => {
    res.clearCookie("auth_token");
    res.json({ message: "Logged out successfully" });
});
// GET /auth/me — returns current user info
router.get("/me", auth_1.authenticateToken, async (req, res) => {
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user: toSafeUser(user) });
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "An unknown error occurred" });
    }
});
// POST /auth/change-password — requires current session
router.post("/change-password", auth_1.authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }
        const validation = (0, password_1.validatePassword)(newPassword);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join("; ") });
        }
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await userRepo.save(user);
        res.json({ message: "Password changed successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "An unknown error occurred" });
    }
});
// POST /auth/forgot-password — generates reset token and sends email
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { email } });
        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({ message: "If an account with that email exists, a reset link has been sent." });
        }
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpiresAt = expiresAt;
        await userRepo.save(user);
        // Send reset email via edge function
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
        await sendResetEmail(user.email, resetUrl);
        res.json({ message: "If an account with that email exists, a reset link has been sent." });
    }
    catch (err) {
        console.error("Forgot password error:", err);
        // Don't leak error details
        res.json({ message: "If an account with that email exists, a reset link has been sent." });
    }
});
// POST /auth/reset-password — validates token and sets new password
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token and new password are required" });
        }
        const validation = (0, password_1.validatePassword)(newPassword);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join("; ") });
        }
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo
            .createQueryBuilder("user")
            .where("user.resetPasswordToken = :token", { token: hashedToken })
            .andWhere("user.resetPasswordExpiresAt > :now", { now: new Date() })
            .getOne();
        if (!user) {
            return res.status(400).json({ error: "Reset token is invalid or has expired" });
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await userRepo.save(user);
        res.json({ message: "Password reset successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "An unknown error occurred" });
    }
});
async function sendResetEmail(email, resetUrl) {
    const edgeFunctionUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/send-reset-email`;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!edgeFunctionUrl || !anonKey) {
        console.warn("Supabase URL or anon key not configured. Reset URL:", resetUrl);
        return;
    }
    const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email, resetUrl }),
    });
    if (!response.ok) {
        const text = await response.text();
        console.error("Failed to send reset email:", response.status, text);
        throw new Error("Failed to send reset email");
    }
}
exports.default = router;
