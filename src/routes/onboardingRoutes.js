import express from "express";
import { updateOnboarding } from "../controllers/onboardingController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/", protect, updateOnboarding);

export default router;