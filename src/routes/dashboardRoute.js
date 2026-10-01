import express from "express";

import { getdashboard } from "../controllers/dashboardcontroller.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getdashboard);

export default router;