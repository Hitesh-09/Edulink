"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadResource = exports.bookmarkResource = exports.upvoteResource = exports.postResource = exports.getResource = exports.getResources = void 0;
const resources_service_1 = require("../services/resources.service");
const getResources = async (req, res, next) => {
    try {
        const userId = req.user?.id || "";
        const { department, semester, subject, resource_type, search, sortBy, page, limit, uploaded_by, bookmarked_by, } = req.query;
        const result = await (0, resources_service_1.listResources)(userId, {
            department: department ? String(department) : undefined,
            semester: semester ? Number(semester) : undefined,
            subject: subject ? String(subject) : undefined,
            resource_type: resource_type,
            search: search ? String(search) : undefined,
            sortBy: sortBy,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            uploaded_by: uploaded_by ? String(uploaded_by) : undefined,
            bookmarked_by: bookmarked_by ? String(bookmarked_by) : undefined,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getResources = getResources;
const getResource = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const resource = await (0, resources_service_1.getResourceById)(req.params.id, userId);
        res.json(resource);
    }
    catch (error) {
        next(error);
    }
};
exports.getResource = getResource;
const postResource = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { title, description, resource_type, subject_name, subject_code, department, year, semester, file_url, file_name, file_size, file_type, } = req.body;
        if (!title || !resource_type || !subject_name || !department || !year || !semester || !file_url || !file_name) {
            res.status(400).json({
                error: "Missing required fields: title, resource_type, subject_name, department, year, semester, file_url, file_name",
            });
            return;
        }
        const created = await (0, resources_service_1.createResource)(userId, {
            title,
            description,
            resource_type,
            subject_name,
            subject_code,
            department,
            year: Number(year),
            semester: Number(semester),
            file_url,
            file_name,
            file_size: file_size ? Number(file_size) : undefined,
            file_type,
        });
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
};
exports.postResource = postResource;
const upvoteResource = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = await (0, resources_service_1.toggleUpvoteResource)(userId, req.params.id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.upvoteResource = upvoteResource;
const bookmarkResource = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = await (0, resources_service_1.toggleBookmarkResource)(userId, req.params.id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.bookmarkResource = bookmarkResource;
const downloadResource = async (req, res, next) => {
    try {
        await (0, resources_service_1.recordDownload)(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.downloadResource = downloadResource;
