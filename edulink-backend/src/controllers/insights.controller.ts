import { NextFunction, Request, Response } from "express";
import { getUserInsights } from "../services/insights.service";

/** Returns the caller's study and collaboration insights. */
export const getInsights = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return void res.status(401).json({ error: "Unauthorized" });

    const result = await getUserInsights(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
