import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDb from "./src/config/db.js";

import authRoute from "./src/routes/authRoute.js";
import onboardingRoutes from "./src/routes/onboardingRoutes.js";

import examRoutes from "./src/routes/examRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import topicRoutes from "./src/routes/topicRoutes.js";
import questionRoutes from "./src/routes/questionRoutes.js";

import attemptRoutes from "./src/routes/attemptRoutes.js";

import dashboardRoute from "./src/routes/dashboardRoute.js";
import practiceRoutes from "./src/routes/practiceRoutes.js";
import practiceSessionRoutes from "./src/routes/practiceSessionRoutes.js";

dotenv.config();

const app = express();

// ======================================================
// DATABASE
// ======================================================

connectDb();

// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://snack-runtime.eascdn.net",
  "https://snack.expo.dev",
].filter(Boolean);

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "DELETE"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors(corsOptions));
app.use(express.json());

// ======================================================
// AUTH
// ======================================================

app.use("/api/auth", authRoute);

// ======================================================
// ONBOARDING
// ======================================================

app.use("/api/onboarding", onboardingRoutes);

// ======================================================
// EXAM / CURRICULUM
// ======================================================

app.use("/api/exams", examRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/topics", topicRoutes);

// ======================================================
// QUESTION BANK
// ======================================================

app.use("/api/questions", questionRoutes);

// ======================================================
// ASSESSMENT
// ======================================================

app.use("/api/attempts", attemptRoutes);

// ======================================================
// PRACTICE
// ======================================================

app.use("/api/practice", practiceRoutes);
app.use("/api/practice-sessions", practiceSessionRoutes);

// ======================================================
// DASHBOARD
// ======================================================

app.use("/api/dashboard", dashboardRoute);

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to ExamPrep NG API",
  });
});

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: {},
  });
});

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;