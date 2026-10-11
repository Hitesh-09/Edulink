import { NextFunction, Request, Response } from "express";
import {
  acceptAnswer,
  createAnswer,
  createDoubt,
  getDoubtById,
  listDoubts,
  toggleUpvoteAnswer,
  toggleUpvoteDoubt,
} from "../services/doubts.service";

export const getDoubts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id || "";
    const {
      department,
      semester,
      subject,
      status,
      search,
      sortBy,
      page,
      limit,
      author_id,
    } = req.query;

    const result = await listDoubts(userId, {
      department: department ? String(department) : undefined,
      semester: semester ? Number(semester) : undefined,
      subject: subject ? String(subject) : undefined,
      status: status as any,
      search: search ? String(search) : undefined,
      sortBy: sortBy as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      author_id: author_id ? String(author_id) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDoubt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await getDoubtById(req.params.id, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const postDoubt = async (
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

    const { title, content, subject_name, department, year, semester, tags } = req.body;

    if (!title || !content || !subject_name) {
      res.status(400).json({
        error: "Missing required fields: title, content, subject_name",
      });
      return;
    }

    const created = await createDoubt(userId, {
      title,
      content,
      subject_name,
      department,
      year: year ? Number(year) : undefined,
      semester: semester ? Number(semester) : undefined,
      tags: Array.isArray(tags) ? tags : undefined,
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const postAnswer = async (
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

    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: "Answer content is required" });
      return;
    }

    const answer = await createAnswer(userId, req.params.id, content.trim());
    res.status(201).json(answer);
  } catch (error) {
    next(error);
  }
};

export const upvoteDoubt = async (
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

    const result = await toggleUpvoteDoubt(userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const upvoteAnswer = async (
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

    const result = await toggleUpvoteAnswer(userId, req.params.answerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const acceptAnswerHandler = async (
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

    const result = await acceptAnswer(userId, req.params.answerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
