import express from "express";
import cors from "cors";
import connectDb from "./src/config/db.js";
import dotenv from "dotenv";
import questionRoutes from "./src/routes/questionRoutes.js";

dotenv.config();

const app = express();

connectDb();

app.use(cors());
app.use(express.json());
// Question Bank API routes
app.use("/api/questions", questionRoutes);

import authRoute from "./src/routes/authRoute.js";
app.use("/api/auth", authRoute);

app.get("/", (req, res) => {
  res.send("Welcome to my API");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;