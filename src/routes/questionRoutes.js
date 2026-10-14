
import express from "express";
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";
import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Questions
 *     description: Manage examination questions
 */

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Questions retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get("/", protect, getQuestions);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get a question by ID
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Question retrieved successfully
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: Question not found
 */
router.get("/:id", protect, getQuestionById);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a question
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               topicId:
 *                 type: string
 *               year:
 *                 type: integer
 *               questionText:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     text:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *               explanation:
 *                 type: string
 *             required:
 *               - examId
 *               - subjectId
 *               - topicId
 *               - questionText
 *               - options
 *     responses:
 *       '201':
 *         description: Question created successfully
 *       '400':
 *         description: Invalid question data
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Teacher or admin permission required
 */
router.post("/", protect, authorize("teacher", "admin"), createQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update a question
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               topicId:
 *                 type: string
 *               year:
 *                 type: integer
 *               questionText:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     text:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *               explanation:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Question updated successfully
 *       '400':
 *         description: Invalid question data
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Permission denied
 *       '404':
 *         description: Question not found
 */
router.put("/:id", protect, authorize("teacher", "admin"), updateQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Question deleted successfully
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Permission denied
 *       '404':
 *         description: Question not found
 */
router.delete("/:id", protect, authorize("teacher", "admin"), deleteQuestion);

export default router;
