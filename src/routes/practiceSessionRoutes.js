
import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { getPracticeSessions } from "../controllers/practiceSessionController.js";

const router = express.Router();

/**
 * @swagger
 * /api/practice-sessions:
 *   get:
 *     summary: Get practice sessions
 *     tags:
 *       - Practice Sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Practice sessions retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get("/", protect, getPracticeSessions);

export default router;
