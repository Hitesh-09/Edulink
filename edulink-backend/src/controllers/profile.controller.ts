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
    const userEmail = req.user?.email;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const {
      full_name,
      register_no,
      college = "SRM Institute of Science and Technology",
      campus = "KTR",
      degree = "B.Tech",
      branch,
      year,
      semester,
      avatar_url,
      interests,
    } = req.body;

    if (!full_name || !branch || !year) {
      res.status(400).json({
        error: "full_name, branch, and year are required",
      });
      return;
    }

    const calculatedSemester = semester ? Number(semester) : ((Number(year) - 1) * 2 + 1);

    const result = await upsertOwnProfile(
      userId,
      {
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
      },
      userEmail
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};
