import { NextFunction, Request, Response } from "express";
import {
  createResource,
  getResourceById,
  listResources,
  recordDownload,
  toggleBookmarkResource,
  toggleUpvoteResource,
} from "../services/resources.service";

export const getResources = async (
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
      resource_type,
      search,
      sortBy,
      page,
      limit,
      uploaded_by,
      bookmarked_by,
    } = req.query;

    const result = await listResources(userId, {
      department: department ? String(department) : undefined,
      semester: semester ? Number(semester) : undefined,
      subject: subject ? String(subject) : undefined,
      resource_type: resource_type as any,
      search: search ? String(search) : undefined,
      sortBy: sortBy as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      uploaded_by: uploaded_by ? String(uploaded_by) : undefined,
      bookmarked_by: bookmarked_by ? String(bookmarked_by) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const resource = await getResourceById(req.params.id, userId);
    res.json(resource);
  } catch (error) {
    next(error);
  }
};

export const postResource = async (
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

    const {
      title,
      description,
      resource_type,
      subject_name,
      subject_code,
      department,
      year,
      semester,
      file_url,
      file_name,
      file_size,
      file_type,
    } = req.body;

    if (!title || !resource_type || !subject_name || !department || !year || !semester || !file_url || !file_name) {
      res.status(400).json({
        error: "Missing required fields: title, resource_type, subject_name, department, year, semester, file_url, file_name",
      });
      return;
    }

    const created = await createResource(userId, {
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
  } catch (error) {
    next(error);
  }
};

export const upvoteResource = async (
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

    const result = await toggleUpvoteResource(userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const bookmarkResource = async (
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

    const result = await toggleBookmarkResource(userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const downloadResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await recordDownload(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
