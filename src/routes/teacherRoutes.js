import express from "express";
import { createTeacher } from "../controllers/teacherController.js";
import protect, { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin"), createTeacher);

export default router;