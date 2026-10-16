
import express from "express";
import { getAdminDashboard } from "../controllers/adminController.js";
import {
  getAdminQuestions,
  getAdminQuestionById,
   updateAdminQuestionStatus,
} from "../controllers/adminQuestionController.js";
import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin dashboard
router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  getAdminDashboard
);

// Admin question bank
router.get(
  "/questions",
  protect,
  authorize("admin"),
  getAdminQuestions
);

router.get(
  "/questions/:id",
  protect,
  authorize("admin"),
  getAdminQuestionById
);

router.patch(
  "/questions/:id/status",
  protect,
  authorize("admin"),
  updateAdminQuestionStatus
);

export default router;
