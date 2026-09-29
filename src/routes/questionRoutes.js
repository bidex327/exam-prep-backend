import express from "express";

import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from "../controllers/questionController.js";

const router = express.Router();

// Get all questions, with optional filters
router.get("/", getQuestions);

// Get one question by ID
router.get("/:id", getQuestionById);

// Create a new question
router.post("/", createQuestion);

// Update an existing question
router.put("/:id", updateQuestion);

// Delete an existing question
router.delete("/:id", deleteQuestion);

// Export the router so app.js can use it
export default router;