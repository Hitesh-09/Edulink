"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const users_service_1 = require("../services/users.service");
/** Returns searchable/filterable user discovery list excluding caller. */
const getUsers = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = await (0, users_service_1.listUsers)(userId, {
            interest: req.query.interest,
            year: req.query.year ? Number(req.query.year) : undefined,
            degree: req.query.degree,
            branch: req.query.branch,
            search: req.query.search,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
