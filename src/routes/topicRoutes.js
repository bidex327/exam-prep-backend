import express from "express";

import {
  createTopic,
  getTopics,
} from "../controllers/topicController.js";

import protect, {
  authorize,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a topic — teachers and admins only
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  createTopic
);

// Get topics — authenticated users
router.get(
  "/",
  protect,
  getTopics
);

export default router;