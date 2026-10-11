import { Router } from "express";
import {
  acceptAnswerHandler,
  getDoubt,
  getDoubts,
  postAnswer,
  postDoubt,
  upvoteAnswer,
  upvoteDoubt,
} from "../controllers/doubts.controller";

const router = Router();

router.get("/", getDoubts);
router.post("/", postDoubt);
router.get("/:id", getDoubt);
router.post("/:id/answers", postAnswer);
router.post("/:id/upvote", upvoteDoubt);
router.post("/answers/:answerId/upvote", upvoteAnswer);
router.post("/answers/:answerId/accept", acceptAnswerHandler);

export default router;
