import express from "express";

import {
  createSubject,
  getSubjects
} from "../controllers/subjectController.js";

const router = express.Router();

// Create a new subject
router.post("/", createSubject);

// Get all subjects
router.get("/", getSubjects);

export default router;