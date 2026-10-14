
import express from "express";

import {
  getPracticeQuestions,
  getAvailableYears,
  submitPractice,
} from "../controllers/practiceController.js";

import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get practice questions.
router.get("/", protect, getPracticeQuestions);

// Get available practice years.
router.get("/years", protect, getAvailableYears);

// Submit practice answers.
router.post("/submit", protect, submitPractice);

export default router;