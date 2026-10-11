import { Router } from "express";
import {
  bookmarkResource,
  downloadResource,
  getResource,
  getResources,
  postResource,
  upvoteResource,
} from "../controllers/resources.controller";

const router = Router();

router.get("/", getResources);
router.post("/", postResource);
router.get("/:id", getResource);
router.post("/:id/upvote", upvoteResource);
router.post("/:id/bookmark", bookmarkResource);
router.post("/:id/download", downloadResource);

export default router;
