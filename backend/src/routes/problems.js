import { Router } from "express";
import Problem from "../models/Problem.js";

const router = Router();

// Deliberately public/read-only - browsing problems needs no auth.
router.get("/", async (req, res) => {
  const problems = await Problem.find().select("title slug difficulty tags").lean();
  res.json(problems);
});

router.get("/:slug", async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug }).lean();
  if (!problem) return res.status(404).json({ error: "Problem not found" });
  res.json(problem);
});

export default router;
