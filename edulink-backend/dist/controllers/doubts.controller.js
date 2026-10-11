"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptAnswerHandler = exports.upvoteAnswer = exports.upvoteDoubt = exports.postAnswer = exports.postDoubt = exports.getDoubt = exports.getDoubts = void 0;
const doubts_service_1 = require("../services/doubts.service");
const getDoubts = async (req, res, next) => {
    try {
        const userId = req.user?.id || "";
        const { department, semester, subject, status, search, sortBy, page, limit, author_id, } = req.query;
        const result = await (0, doubts_service_1.listDoubts)(userId, {
            department: department ? String(department) : undefined,
            semester: semester ? Number(semester) : undefined,
            subject: subject ? String(subject) : undefined,
            status: status,
            search: search ? String(search) : undefined,
            sortBy: sortBy,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            author_id: author_id ? String(author_id) : undefined,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getDoubts = getDoubts;
const getDoubt = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const result = await (0, doubts_service_1.getDoubtById)(req.params.id, userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getDoubt = getDoubt;
const postDoubt = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { title, content, subject_name, department, year, semester, tags } = req.body;
        if (!title || !content || !subject_name) {
            res.status(400).json({
                error: "Missing required fields: title, content, subject_name",
            });
            return;
        }
        const created = await (0, doubts_service_1.createDoubt)(userId, {
            title,
            content,
            subject_name,
            department,
            year: year ? Number(year) : undefined,
            semester: semester ? Number(semester) : undefined,
            tags: Array.isArray(tags) ? tags : undefined,
        });
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
};
exports.postDoubt = postDoubt;
const postAnswer = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { content } = req.body;
        if (!content || !content.trim()) {
            res.status(400).json({ error: "Answer content is required" });
            return;
        }
        const answer = await (0, doubts_service_1.createAnswer)(userId, req.params.id, content.trim());
        res.status(201).json(answer);
    }
    catch (error) {
        next(error);
    }
};
exports.postAnswer = postAnswer;
const upvoteDoubt = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = await (0, doubts_service_1.toggleUpvoteDoubt)(userId, req.params.id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.upvoteDoubt = upvoteDoubt;
const upvoteAnswer = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = await (0, doubts_service_1.toggleUpvoteAnswer)(userId, req.params.answerId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.upvoteAnswer = upvoteAnswer;
const acceptAnswerHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = await (0, doubts_service_1.acceptAnswer)(userId, req.params.answerId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.acceptAnswerHandler = acceptAnswerHandler;
