import { NextFunction, Request, Response } from "express";
import {
  createSession,
  deleteSession,
  listSessions,
  updateSession,
} from "../services/sessions.service";

/** Creates a study session for caller and connected participants. */
export const createStudySession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const { groupName, description, participantIds, scheduledAt, durationMinutes } = req.body;
    if (!groupName || !Array.isArray(participantIds) || !scheduledAt || !durationMinutes) {
      return void res.status(400).json({
        error: "groupName, participantIds, scheduledAt, and durationMinutes are required",
      });
    }

    const result = await createSession(userId, {
      groupName,
      description,
      participantIds,
      scheduledAt,
      durationMinutes: Number(durationMinutes),
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/** Returns all study sessions where caller is a participant. */
export const getStudySessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const result = await listSessions(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Updates a session if caller is the creator. */
export const updateStudySession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const result = await updateSession(req.params.id, userId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Deletes a session if caller is the creator. */
export const deleteStudySession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    await deleteSession(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
