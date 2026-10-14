
import express from "express";
import { updateOnboarding } from "../controllers/onboardingController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/onboarding:
 *   put:
 *     summary: Update user onboarding information
 *     description: Saves the authenticated user's onboarding selections.
 *     tags:
 *       - Onboarding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetExam:
 *                 type: string
 *                 description: ID of the selected examination
 *               selectedSubjects:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of the selected subjects
 *             required:
 *               - targetExam
 *               - selectedSubjects
 *     responses:
 *       '200':
 *         description: Onboarding information updated successfully
 *       '400':
 *         description: Invalid examination or subject selections
 *       '401':
 *         description: Authentication required
 */
router.put("/", protect, updateOnboarding);

export default router;
