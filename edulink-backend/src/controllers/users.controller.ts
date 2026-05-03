import { NextFunction, Request, Response } from "express";
import { listUsers } from "../services/users.service";

/** Returns searchable/filterable user discovery list excluding caller. */
export const getUsers = async (
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

    const result = await listUsers(userId, {
      interest: req.query.interest as string | undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      degree: req.query.degree as string | undefined,
      branch: req.query.branch as string | undefined,
      search: req.query.search as string | undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
