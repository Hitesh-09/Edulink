"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const connections_routes_1 = __importDefault(require("./routes/connections.routes"));
const insights_routes_1 = __importDefault(require("./routes/insights.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const sessions_routes_1 = __importDefault(require("./routes/sessions.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
});
app.use("/api/profile", auth_1.authMiddleware, profile_routes_1.default);
app.use("/api/users", auth_1.authMiddleware, users_routes_1.default);
app.use("/api/connections", auth_1.authMiddleware, connections_routes_1.default);
app.use("/api/sessions", auth_1.authMiddleware, sessions_routes_1.default);
app.use("/api/insights", auth_1.authMiddleware, insights_routes_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    console.log(`Edulink backend listening on port ${port}`);
});
