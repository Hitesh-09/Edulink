"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsights = void 0;
const insights_service_1 = require("../services/insights.service");
/** Returns the caller's study and collaboration insights. */
const getInsights = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const result = await (0, insights_service_1.getUserInsights)(userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getInsights = getInsights;
