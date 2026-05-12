import "dotenv/config";
import "reflect-metadata";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth";
import employeeRoutes from "./routes/employees";
import salaryRoutes from "./routes/salaries";
import attendanceRoutes from "./routes/attendance";

const app = express();
const PORT = process.env.PORT || 3000;
let server: http.Server | undefined;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/employees", employeeRoutes);
app.use("/salaries", salaryRoutes);
app.use("/attendance", attendanceRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        database: AppDataSource.isInitialized ? "Connected" : "Disconnected"
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

// Initialize database and start server
AppDataSource.initialize()
    .then(() => {
        console.log("Database connected successfully");
        server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`API URL: http://localhost:${PORT}`);
        });

        server.on("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use. Close the other server or change PORT in .env.`);
            } else {
                console.error("Server listen error:", err);
            }
            process.exit(1);
        });
    })
    .catch((err) => {
        console.error("Database initialization error:", err);
        console.error("Check that PostgreSQL is running and DATABASE_URL points to an existing database.");
        process.exit(1);
    });

const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    if (server) {
        await new Promise<void>((resolve) => server?.close(() => resolve()));
        console.log("HTTP server closed");
    }

    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log("Database connection closed");
    }

    process.exit(0);
};

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
});
