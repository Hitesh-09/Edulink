import { NextFunction, Request, Response } from "express";
import {
  getConnections,
  getReceivedRequests,
  getSentRequests,
  respondToConnectionRequest,
  sendConnectionRequest,
} from "../services/connections.service";

/** Creates a pending connection request for the authenticated user. */
export const requestConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = req.user?.id;
    if (!senderId) return void res.status(401).json({ error: "Unauthorized" });

    const { receiverId } = req.body;
    if (!receiverId) return void res.status(400).json({ error: "receiverId is required" });

    const result = await sendConnectionRequest(senderId, receiverId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/** Accepts or rejects a pending request by receiver. */
export const updateRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const { status } = req.body;
    if (status !== "accepted" && status !== "rejected") {
      return void res.status(400).json({ error: "status must be accepted or rejected" });
    }

    const result = await respondToConnectionRequest(req.params.id, userId, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Gets active user connections and peer profile details. */
export const listConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const result = await getConnections(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Gets incoming pending connection requests. */
export const listReceivedRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const result = await getReceivedRequests(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Gets outgoing pending connection requests. */
export const listSentRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const result = await getSentRequests(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
