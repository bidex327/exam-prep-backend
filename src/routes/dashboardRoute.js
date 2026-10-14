
import express from "express";

import { getDashboard } from "../controllers/dashboardcontroller.js";

import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Student dashboard information
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get the student dashboard
 *     description: Retrieves dashboard information for an authenticated student.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Dashboard retrieved successfully
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Access restricted to students
 */
router.get("/", protect, authorize("student"), getDashboard);

export default router;
