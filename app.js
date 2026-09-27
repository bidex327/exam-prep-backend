import express from "express";
import connectDb from "./src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
connectDb();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to my API");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
