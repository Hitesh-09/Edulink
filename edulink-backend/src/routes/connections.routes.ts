import { Router } from "express";
import {
  listConnections,
  listReceivedRequests,
  listSentRequests,
  requestConnection,
  updateRequestStatus,
} from "../controllers/connections.controller";

const router = Router();

router.post("/request", requestConnection);
router.put("/request/:id", updateRequestStatus);
router.get("/", listConnections);
router.get("/requests/received", listReceivedRequests);
router.get("/requests/sent", listSentRequests);

export default router;
