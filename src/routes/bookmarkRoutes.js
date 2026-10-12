import express from "express";
import protect from "../middlewares/authMiddleware.js";

import {
createBookmark,
getBookmarks,
deleteBookmark,
} from "../controllers/bookmarkController.js";

const router = express.Router();

// Save a question
router.post("/", protect, createBookmark);

// Get the logged-in user's bookmarks
router.get("/", protect, getBookmarks);

// Remove a bookmarked question
router.delete("/:questionId", protect, deleteBookmark);

export default router;
