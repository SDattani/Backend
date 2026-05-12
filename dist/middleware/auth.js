"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.setAuthCookie = exports.createAuthToken = void 0;
exports.isAdmin = isAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const COOKIE_NAME = "auth_token";
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
}
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};
const createAuthToken = (user) => {
    return jsonwebtoken_1.default.sign(user, JWT_SECRET, { expiresIn: "7d" });
};
exports.createAuthToken = createAuthToken;
const setAuthCookie = (res, user) => {
    const token = (0, exports.createAuthToken)(user);
    res.cookie(COOKIE_NAME, token, cookieOptions);
    return token;
};
exports.setAuthCookie = setAuthCookie;
const authenticateToken = (req, res, next) => {
    let token = req.cookies?.[COOKIE_NAME];
    // Also check Authorization header for API clients
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.substring(7);
    }
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.clearCookie(COOKIE_NAME);
        res.status(403).json({ error: "Invalid or expired token" });
    }
};
exports.authenticateToken = authenticateToken;
// export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
//     if (req.user?.role !== "ADMIN") {
//         return res.status(403).json({ error: "Admin access required" });
//     }
//     next();
// };
function isAdmin(req, res, next) {
    let token = req.cookies?.[COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.substring(7);
    }
    if (!token)
        return res.status(401).json({ message: "ReLogin" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== "ADMIN") {
            return res.status(403).json({ message: "Forbidden: Contact to Owner" });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
