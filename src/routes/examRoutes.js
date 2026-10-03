import express from "express";

import {
  createExam,
  getExams
} from "../controllers/examController.js";

const router = express.Router();

// Create a new exam
router.post("/", createExam);

// Get all exams
router.get("/", getExams);

export default router;