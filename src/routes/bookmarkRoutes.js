import express from "express";
import protect from "../middlewares/authMiddleware.js";

import {
createBookmark,
getBookmarks,
deleteBookmark,
} from "../controllers/bookmarkController.js";

const router = express.Router();



/**
 * @swagger
 * tags:
 *   - name: Bookmarks
 *     description: Manage bookmarked questions
 */

/**
 * @swagger
 * /api/bookmarks:
 *   post:
 *     summary: Bookmark a question
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Bookmark created successfully
 *       '201':
 *         description: Bookmark created successfully
 *       '401':
 *         description: Authentication required
 */
router.post("/", protect, createBookmark);

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     summary: Get the logged-in user's bookmarks
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Bookmarks retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get("/", protect, getBookmarks);


/**
 * @swagger
 * /api/bookmarks/{questionId}:
 *   delete:
 *     summary: Remove a bookmarked question
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the question to remove from bookmarks
 *     responses:
 *       '200':
 *         description: Bookmark removed successfully
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: Bookmark not found
 */
router.delete("/:questionId", protect, deleteBookmark);

export default router;
