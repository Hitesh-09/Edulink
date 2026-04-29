"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudySession = exports.updateStudySession = exports.getStudySessions = exports.createStudySession = void 0;
const sessions_service_1 = require("../services/sessions.service");
/** Creates a study session for caller and connected participants. */
const createStudySession = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const { groupName, description, participantIds, scheduledAt, durationMinutes } = req.body;
        if (!groupName || !Array.isArray(participantIds) || !scheduledAt || !durationMinutes) {
            return void res.status(400).json({
                error: "groupName, participantIds, scheduledAt, and durationMinutes are required",
            });
        }
        const result = await (0, sessions_service_1.createSession)(userId, {
            groupName,
            description,
            participantIds,
            scheduledAt,
            durationMinutes: Number(durationMinutes),
        });
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.createStudySession = createStudySession;
/** Returns all study sessions where caller is a participant. */
const getStudySessions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const result = await (0, sessions_service_1.listSessions)(userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudySessions = getStudySessions;
/** Updates a session if caller is the creator. */
const updateStudySession = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const result = await (0, sessions_service_1.updateSession)(req.params.id, userId, req.body);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateStudySession = updateStudySession;
/** Deletes a session if caller is the creator. */
const deleteStudySession = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        await (0, sessions_service_1.deleteSession)(req.params.id, userId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStudySession = deleteStudySession;
