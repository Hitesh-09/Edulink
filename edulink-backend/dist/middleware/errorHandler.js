"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
/** Sends normalized error response for unhandled route errors. */
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.status ?? 500;
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${req.method} ${req.originalUrl}`, err.message);
    res.status(statusCode).json({
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    });
};
exports.errorHandler = errorHandler;
