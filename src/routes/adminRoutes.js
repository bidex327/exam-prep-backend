import express from "express";
import { getAdminDashboard } from "../controllers/adminController.js";
import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  getAdminDashboard
);

export default router;
