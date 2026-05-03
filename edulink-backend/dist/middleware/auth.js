"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const supabase_1 = require("../lib/supabase");
/** Validates Supabase bearer token and injects req.user. */
const authMiddleware = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : undefined;
    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { data, error } = await supabase_1.supabase.auth.getUser(token);
    if (error || !data.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    req.user = {
        id: data.user.id,
        email: data.user.email ?? "",
    };
    next();
};
exports.authMiddleware = authMiddleware;
