import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  startAttempt,
  listAttemptsForProblem,
  listMyAttempts,
  getAttempt,
} from "../controllers/attemptController.js";

const router = Router();

router.use(requireAuth);
router.post("/", startAttempt);
router.get("/", listMyAttempts);
router.get("/:id", getAttempt);
router.get("/problem/:problemId", listAttemptsForProblem);

export default router;
