import { Router } from "express";
import {
  createStudySession,
  deleteStudySession,
  getStudySessions,
  getStudySessionDetails,
  updateStudySession,
} from "../controllers/sessions.controller";

const router = Router();

router.post("/", createStudySession);
router.get("/", getStudySessions);
router.get("/:id", getStudySessionDetails);
router.put("/:id", updateStudySession);
router.delete("/:id", deleteStudySession);

export default router;
