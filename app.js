import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDb from "./src/config/db.js";
import questionRoutes from "./src/routes/questionRoutes.js";
import dashboardRoute from "./src/routes/dashboardRoute.js";
import authRoute from "./src/routes/authRoute.js";

dotenv.config();

const app = express();

connectDb();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/questions", questionRoutes);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/auth", authRoute);

app.get("/", (req, res) => {
  res.send("Welcome to my API");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;