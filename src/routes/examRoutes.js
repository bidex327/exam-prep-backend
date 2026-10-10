import express from "express";

import {
  createExam,
  getExams,
} from "../controllers/examController.js";

import protect, {
  authorize,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create an exam — admins only
router.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  createExam
);

// Get exams — authenticated users
router.get(
  "/",
  protect,
  getExams
);

export default router;