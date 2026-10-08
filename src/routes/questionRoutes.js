import express from "express";

import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";

import protect from "../middlewares/authMiddleware.js";
import teacherOnly from "../middlewares/teacherMiddleware.js";

const router = express.Router();

// ======================================================
// GET ALL QUESTIONS
// ======================================================
// Students and teachers can retrieve questions.
//
// Supports filters:
// ?examId=...
// ?subjectId=...
// ?topicId=...
// ?year=...
// ======================================================

router.get("/", getQuestions);

// ======================================================
// GET ONE QUESTION
// ======================================================
// Get a specific question by ID.
// ======================================================

router.get("/:id", getQuestionById);

// ======================================================
// CREATE QUESTION
// ======================================================
// Only authenticated teachers can create questions.
//
// Flow:
//
// Request
//   ↓
// protect
//   ↓
// teacherOnly
//   ↓
// createQuestion
// ======================================================

router.post("/", protect, teacherOnly, createQuestion);

// ======================================================
// UPDATE QUESTION
// ======================================================
// Only authenticated teachers can update questions.
// ======================================================

router.put("/:id", protect, teacherOnly, updateQuestion);

// ======================================================
// DELETE QUESTION
// ======================================================
// Only authenticated teachers can delete questions.
// ======================================================

router.delete("/:id", protect, teacherOnly, deleteQuestion);

// ======================================================
// EXPORT ROUTER
// ======================================================

export default router;