
import express from "express";

import {
  createTopic,
  getTopics,
} from "../controllers/topicController.js";

import protect, {
  authorize,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Topics
 *     description: Manage topics within examination subjects
 */

/**
 * @swagger
 * /api/topics:
 *   post:
 *     summary: Create a topic
 *     description: Allows authenticated teachers and admins to create a topic.
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Algebra
 *               subjectId:
 *                 type: string
 *                 example: 650abc123456789012345678
 *             required:
 *               - name
 *               - subjectId
 *     responses:
 *       '201':
 *         description: Topic created successfully
 *       '400':
 *         description: Invalid topic details
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Teacher or admin permission required
 */
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  createTopic
);

/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: Get topics
 *     description: Retrieves topics for authenticated users.
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Topics retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get(
  "/",
  protect,
  getTopics
);

export default router;
