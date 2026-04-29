"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const insights_controller_1 = require("../controllers/insights.controller");
const router = (0, express_1.Router)();
router.get("/", insights_controller_1.getInsights);
exports.default = router;
