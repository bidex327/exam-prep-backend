import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getSettings,
  updateSettings,
  uploadProfilePicture
} from "../controllers/settingsController.js";
import upload from "../middlewares/uploadProfilePicture.js";

const router = express.Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get user settings
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Settings retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get("/", protect, getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update user settings
 *     tags:
 *       - Settings
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
 *       '200':
 *         description: Settings updated successfully
 *       '400':
 *         description: Invalid settings data
 *       '401':
 *         description: Authentication required
 */
router.put("/", protect, updateSettings);



router.post(
  "/profile-picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture
);

export default router;
