import express from "express";

import {
startAttempt,
submitAttempt,
getAttemptById,
} from "../controllers/attemptController.js";

import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Start a new attempt.
router.post("/", protect, startAttempt);

// Submit answers for an existing attempt.
router.post("/:id/submit", protect, submitAttempt);

// Get one attempt belonging to the authenticated user.
router.get("/:id", protect, getAttemptById);

export default router;
