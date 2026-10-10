
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";

dotenv.config();

const resetAdminPassword = async () => {
  try {
    const emailOrPhone = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!emailOrPhone || !password) {
      throw new Error(
        "Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file."
      );
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");

    const admin = await User.findOne({
      emailOrPhone,
      role: "admin",
    });

    if (!admin) {
      throw new Error(
        "No admin account was found with the configured ADMIN_EMAIL."
      );
    }

    // User.js hashes the password automatically when it is changed.
    admin.password = password;
    admin.emailVerified = true;

    await admin.save();

    console.log("Admin password reset successfully.");
    console.log(`Admin email: ${emailOrPhone}`);
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

resetAdminPassword();