import express from "express";

import {
  createSubject,
  getSubjects,
} from "../controllers/subjectController.js";

import protect, {
  authorize,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a subject — teachers and admins only
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  createSubject
);

// Get subjects — authenticated users
router.get(
  "/",
  protect,
  getSubjects
);

export default router;