import express from "express";
import cors from "cors";
import connectDb from "./src/config/db.js";
import dotenv from "dotenv";

// Question Bank routes
import questionRoutes from "./src/routes/questionRoutes.js";

// Foundation model routes
import examRoutes from "./src/routes/examRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import topicRoutes from "./src/routes/topicRoutes.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDb();

// Middleware
app.use(cors());
app.use(express.json());
// Question Bank API routes
app.use("/api/questions", questionRoutes);

import authRoute from "./src/routes/authRoute.js";
app.use("/api/auth", authRoute);

// Question Bank API routes
app.use("/api/questions", questionRoutes);

// Exam, Subject and Topic API routes
app.use("/api/exams", examRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/topics", topicRoutes);

// Home route
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