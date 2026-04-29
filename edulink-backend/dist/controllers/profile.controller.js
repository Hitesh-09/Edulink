"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const profile_service_1 = require("../services/profile.service");
/** Returns profile and interests by user ID. */
const getProfile = async (req, res, next) => {
    try {
        const result = await (0, profile_service_1.getProfileById)(req.params.id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
/** Updates authenticated user profile and interests. */
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { full_name, college, degree, branch, year, interests } = req.body;
        if (!full_name || !college || !degree || !branch || !year) {
            res.status(400).json({
                error: "full_name, college, degree, branch, and year are required",
            });
            return;
        }
        const result = await (0, profile_service_1.upsertOwnProfile)(userId, {
            full_name,
            college,
            degree,
            branch,
            year: Number(year),
            interests,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
