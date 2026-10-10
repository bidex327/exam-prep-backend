import express from "express";

import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";

import protect, {
  authorize,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all questions
// Logged-in users can view questions
router.get("/", protect, getQuestions);

// Get one question
// Logged-in users can view questions
router.get("/:id", protect, getQuestionById);

// Create a question
// Only teachers and admins
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  createQuestion
);

// Update a question
// Only teachers and admins
// Controller additionally checks ownership for teachers
router.put(
  "/:id",
  protect,
  authorize("teacher", "admin"),
  updateQuestion
);

// Delete a question
// Only teachers and admins
// Controller additionally checks ownership for teachers
router.delete(
  "/:id",
  protect,
  authorize("teacher", "admin"),
  deleteQuestion
);

export default router;