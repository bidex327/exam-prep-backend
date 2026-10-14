
import express from "express";

import {
  createSubject,
  getSubjects,
  updateSubject,
} from "../controllers/subjectController.js";

import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Subjects
 *     description: Manage examination subjects
 */

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a subject
 *     description: Allows authenticated teachers and admins to create a subject.
 *     tags: [Subjects]
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
 *                 example: Mathematics
 *               examId:
 *                 type: string
 *                 example: 650abc123456789012345678
 *               isCompulsory:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - name
 *               - examId
 *     responses:
 *       '201':
 *         description: Subject created successfully
 *       '400':
 *         description: Invalid subject details
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Teacher or admin permission required
 */
router.post("/", protect, authorize("teacher", "admin"), createSubject);

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get subjects
 *     description: Retrieves subjects for authenticated users.
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Subjects retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get("/", protect, getSubjects);

/**
 * @swagger
 * /api/subjects/{subjectId}:
 *   patch:
 *     summary: Update a subject
 *     description: Allows authenticated admins to update a subject.
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subject to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Further Mathematics
 *               isCompulsory:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       '200':
 *         description: Subject updated successfully
 *       '400':
 *         description: Invalid subject details
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Admin permission required
 *       '404':
 *         description: Subject not found
 */
router.patch("/:subjectId", protect, authorize("admin"), updateSubject);

export default router;
