import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDb from "./src/config/db.js";
import "./src/models/Subject.js";
import questionRoutes from "./src/routes/questionRoutes.js";
import dashboardRoute from "./src/routes/dashboardRoute.js";
import authRoute from "./src/routes/authRoute.js";

dotenv.config();

const app = express();

connectDb();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5500",
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