import express from "express";

import {
  getPracticeQuestions,
  submitPractice,
} from "../controllers/practiceController.js";

import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================================
// GET PRACTICE QUESTIONS
// ======================================================
// Optional filters:
// ?examId=...
// ?subjectId=...
// ?topicId=...
// ?year=...
//
// Example:
// GET /api/practice?year=2025
// ======================================================

router.get("/", getPracticeQuestions);

// ======================================================
// SUBMIT PRACTICE
// ======================================================
// The protect middleware checks the student's JWT first.
//
// The controller then uses req.user._id to identify
// the authenticated student.
//
// Example:
// POST /api/practice/submit
// ======================================================

router.post("/submit", protect, submitPractice);

// Export the router.
export default router;