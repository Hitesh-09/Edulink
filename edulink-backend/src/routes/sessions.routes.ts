import { Router } from "express";
import {
  createStudySession,
  deleteStudySession,
  getStudySessions,
  updateStudySession,
} from "../controllers/sessions.controller";

const router = Router();

router.post("/", createStudySession);
router.get("/", getStudySessions);
router.put("/:id", updateStudySession);
router.delete("/:id", deleteStudySession);

export default router;
