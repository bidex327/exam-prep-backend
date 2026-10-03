import express from "express";

import protect from "../middlewares/authMiddleware.js";

import {
  getPracticeSessions,
} from "../controllers/practiceSessionController.js";

const router = express.Router();

router.get("/", protect, getPracticeSessions);

export default router;