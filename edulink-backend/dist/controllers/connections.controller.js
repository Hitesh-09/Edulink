"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSentRequests = exports.listReceivedRequests = exports.listConnections = exports.updateRequestStatus = exports.requestConnection = void 0;
const connections_service_1 = require("../services/connections.service");
/** Creates a pending connection request for the authenticated user. */
const requestConnection = async (req, res, next) => {
    try {
        const senderId = req.user?.id;
        if (!senderId)
            return void res.status(401).json({ error: "Unauthorized" });
        const { receiverId } = req.body;
        if (!receiverId)
            return void res.status(400).json({ error: "receiverId is required" });
        const result = await (0, connections_service_1.sendConnectionRequest)(senderId, receiverId);
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.requestConnection = requestConnection;
/** Accepts or rejects a pending request by receiver. */
const updateRequestStatus = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const { status } = req.body;
        if (status !== "accepted" && status !== "rejected") {
            return void res.status(400).json({ error: "status must be accepted or rejected" });
        }
        const result = await (0, connections_service_1.respondToConnectionRequest)(req.params.id, userId, status);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateRequestStatus = updateRequestStatus;
/** Gets active user connections and peer profile details. */
const listConnections = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const result = await (0, connections_service_1.getConnections)(userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.listConnections = listConnections;
/** Gets incoming pending connection requests. */
const listReceivedRequests = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const result = await (0, connections_service_1.getReceivedRequests)(userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.listReceivedRequests = listReceivedRequests;
/** Gets outgoing pending connection requests. */
const listSentRequests = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return void res.status(401).json({ error: "Unauthorized" });
        const result = await (0, connections_service_1.getSentRequests)(userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.listSentRequests = listSentRequests;
