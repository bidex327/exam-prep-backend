
import express from "express";
import { createTeacher , getTeacherDashboard} from "../controllers/teacherController.js";
import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Create a teacher account
 *     description: Allows an authenticated administrator to create a teacher.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *             example: {}
 *     responses:
 *       '201':
 *         description: Teacher created successfully
 *       '400':
 *         description: Invalid teacher data
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Admin access required
 */
router.post("/", protect, authorize("admin"), createTeacher);
router.get(
  "/dashboard",
  protect,
  authorize("teacher"),
  getTeacherDashboard
);

export default router;
