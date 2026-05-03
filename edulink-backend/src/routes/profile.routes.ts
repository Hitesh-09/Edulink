import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller";

const router = Router();

router.get("/:id", getProfile);
router.put("/", updateProfile);

export default router;
