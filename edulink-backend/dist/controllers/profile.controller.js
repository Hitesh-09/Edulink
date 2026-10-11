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
        const { full_name, register_no, college = "SRM Institute of Science and Technology", campus = "KTR", degree = "B.Tech", branch, year, semester, avatar_url, interests, } = req.body;
        if (!full_name || !branch || !year) {
            res.status(400).json({
                error: "full_name, branch, and year are required",
            });
            return;
        }
        const calculatedSemester = semester ? Number(semester) : ((Number(year) - 1) * 2 + 1);
        const result = await (0, profile_service_1.upsertOwnProfile)(userId, {
            full_name,
            register_no: register_no ? String(register_no).trim().toUpperCase() : undefined,
            college,
            campus: campus || "KTR",
            degree,
            branch,
            year: Number(year),
            semester: calculatedSemester,
            avatar_url,
            interests,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
