import { NextFunction, Request, Response } from "express";
import { getProfileById, upsertOwnProfile } from "../services/profile.service";

/** Returns profile and interests by user ID. */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getProfileById(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Updates authenticated user profile and interests. */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const result = await upsertOwnProfile(userId, {
      full_name,
      college,
      degree,
      branch,
      year: Number(year),
      interests,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
