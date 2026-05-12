"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const data_source_1 = require("./data-source");
const auth_1 = __importDefault(require("./routes/auth"));
const employees_1 = __importDefault(require("./routes/employees"));
const salaries_1 = __importDefault(require("./routes/salaries"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
let server;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use("/auth", auth_1.default);
app.use("/employees", employees_1.default);
app.use("/salaries", salaries_1.default);
app.use("/attendance", attendance_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        database: data_source_1.AppDataSource.isInitialized ? "Connected" : "Disconnected"
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});
// Initialize database and start server
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Database connected successfully");
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`API URL: http://localhost:${PORT}`);
    });
    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use. Close the other server or change PORT in .env.`);
        }
        else {
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
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (server) {
        await new Promise((resolve) => server?.close(() => resolve()));
        console.log("HTTP server closed");
    }
    if (data_source_1.AppDataSource.isInitialized) {
        await data_source_1.AppDataSource.destroy();
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
