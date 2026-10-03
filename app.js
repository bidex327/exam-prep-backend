import express from "express";
import onboardingRoutes from "./src/routes/onboardingRoutes.js";
import cors from "cors";
import dotenv from "dotenv";

import connectDb from "./src/config/db.js";
import "./src/models/Subject.js";

import questionRoutes from "./src/routes/questionRoutes.js";
import dashboardRoute from "./src/routes/dashboardRoute.js";
import authRoute from "./src/routes/authRoute.js";

import examRoutes from "./src/routes/examRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import topicRoutes from "./src/routes/topicRoutes.js";

// Practice API route
import practiceRoutes from "./src/routes/practiceRoutes.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDb();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

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

app.use(cors(corsOptions));
app.use(express.json());

<<<<<<< HEAD
app.use("/api/onboarding", onboardingRoutes);

=======
// API routes
app.use("/api/questions", questionRoutes);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/auth", authRoute);

app.use("/api/exams", examRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/topics", topicRoutes);

// Practice API
app.use("/api/practice", practiceRoutes);

// Home route
>>>>>>> staging
app.get("/", (req, res) => {
  res.send("Welcome to my API");
});

// Server port
const PORT = process.env.PORT || 4000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;