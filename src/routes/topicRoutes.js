import express from "express";

import {
  createTopic,
  getTopics
} from "../controllers/topicController.js";

const router = express.Router();

// Create a new topic
router.post("/", createTopic);

// Get all topics
router.get("/", getTopics);

export default router;