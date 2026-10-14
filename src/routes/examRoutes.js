import express from "express";

import {
  createExam,
  getExams,
} from "../controllers/examController.js";

import protect, {
  authorize,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Exams
 *     description: Manage examination categories
 */

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create a new exam
 *     description: Allows authenticated admins and teachers to create an exam.
 *     tags: [Exams]
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
 *                 example: Joint Admissions and Matriculation Board
 *               code:
 *                 type: string
 *                 example: JAMB
 *               description:
 *                 type: string
 *                 example: University entrance examination
 *             required:
 *               - name
 *               - code
 *     responses:
 *       '201':
 *         description: Exam created successfully
 *       '400':
 *         description: Invalid exam details
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Admin or teacher permission required
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  createExam
);

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: Get all exams
 *     description: Retrieves exams for authenticated users.
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Exams retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get(
  "/",
  protect,
  getExams
);

export default router;
