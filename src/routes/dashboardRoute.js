
import express from "express";

import { getDashboard } from "../controllers/dashboardcontroller.js";

import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("student"), getDashboard);

export default router;
