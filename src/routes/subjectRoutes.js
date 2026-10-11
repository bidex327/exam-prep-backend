
import express from "express";

import {
  createSubject,
  getSubjects,
  updateSubject,
} from "../controllers/subjectController.js";

import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a subject (teachers and admins)
router.post("/", protect, authorize("teacher", "admin"), createSubject);

// Get subjects (authenticated users)
router.get("/", protect, getSubjects);

// Update a subject (admins only)
router.patch("/:subjectId", protect, authorize("admin"), updateSubject);

export default router;
