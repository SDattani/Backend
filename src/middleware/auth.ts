import { Request, Response, NextFunction, CookieOptions } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: { id: string; role: string; email: string };
        }
    }
}

interface JWTPayload {
    id: string;
    email: string;
    role: string;
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";
const COOKIE_NAME = "auth_token";

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
}

const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

export const createAuthToken = (user: JWTPayload) => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
};

export const setAuthCookie = (res: Response, user: JWTPayload) => {
    const token = createAuthToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions);
    return token;
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies?.[COOKIE_NAME];

    // Also check Authorization header for API clients
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.substring(7);
    }

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie(COOKIE_NAME);
        res.status(403).json({ error: "Invalid or expired token" });
    }
};

// export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
//     if (req.user?.role !== "ADMIN") {
//         return res.status(403).json({ error: "Admin access required" });
//     }
//     next();
// };

export function isAdmin(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.substring(7);
    }

    if (!token) return res.status(401).json({ message: "ReLogin" });

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== "ADMIN") {
            return res.status(403).json({ message: "Forbidden: Contact to Owner" });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
