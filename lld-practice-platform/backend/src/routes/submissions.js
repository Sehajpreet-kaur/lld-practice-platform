import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createSubmission, getSubmission, retrySubmission } from "../controllers/submissionController.js";

const router = Router();

router.use(requireAuth);
router.post("/", createSubmission);
router.get("/:id", getSubmission);
router.post("/:id/retry", retrySubmission);

export default router;
