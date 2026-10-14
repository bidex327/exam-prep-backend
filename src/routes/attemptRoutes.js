import express from "express";
import {
  startAttempt,
  submitAttempt,
  getAttemptById,
} from "../controllers/attemptController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Attempts
 *     description: Start, submit, and retrieve examination attempts
 */

/**
 * @swagger
 * /api/attempts:
 *   post:
 *     summary: Start a new attempt
 *     tags:
 *       - Attempts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Attempt started successfully
 *       '400':
 *         description: Invalid attempt request
 *       '401':
 *         description: Authentication required
 */
router.post("/", protect, startAttempt);

/**
 * @swagger
 * /api/attempts/{id}/submit:
 *   post:
 *     summary: Submit answers for an attempt
 *     tags:
 *       - Attempts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *             example: {}
 *     responses:
 *       '200':
 *         description: Attempt submitted successfully
 *       '400':
 *         description: Invalid submission
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: Attempt not found
 */
router.post("/:id/submit", protect, submitAttempt);

/**
 * @swagger
 * /api/attempts/{id}:
 *   get:
 *     summary: Get an attempt by ID
 *     description: Retrieves an attempt belonging to the authenticated user.
 *     tags:
 *       - Attempts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *     responses:
 *       '200':
 *         description: Attempt retrieved successfully
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: Attempt not found
 */
router.get("/:id", protect, getAttemptById);

export default router;
