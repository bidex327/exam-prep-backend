import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../src/models/User.js";

dotenv.config();

const createAdmin = async () => {
try {
await mongoose.connect(process.env.MONGO_URI);
console.log("Database connected successfully.");


const existingAdmin = await User.findOne({ role: "admin" });

if (existingAdmin) {
  console.log("An admin account already exists.");
  return;
}

const fullName = process.env.ADMIN_NAME;
const emailOrPhone = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!fullName || !emailOrPhone || !password) {
  throw new Error(
    "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in your .env file."
  );
}

const existingUser = await User.findOne({ emailOrPhone });

if (existingUser) {
  throw new Error(
    "This email already belongs to an account. Use a different email for the initial admin."
  );
}

await User.create({
  fullName,
  emailOrPhone,
  password,
  role: "admin",
  emailVerified: true,
});

console.log("Initial admin account created successfully.");
console.log(`Admin email: ${emailOrPhone}`);


} catch (error) {
console.error("Admin setup failed:", error.message);
process.exitCode = 1;
} finally {
await mongoose.disconnect();
}
};

createAdmin();
