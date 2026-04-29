import { NextFunction, Request, Response } from "express";
import { supabase } from "../lib/supabase";

/** Validates Supabase bearer token and injects req.user. */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? "",
  };

  next();
};
