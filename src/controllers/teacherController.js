import crypto from "crypto";
import User from "../models/User.js";
import { sendMail } from "../config/sendMailDb.js";

// POST /api/teachers  (admin only)
export const createTeacher = async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const emailOrPhone = req.body.emailOrPhone?.trim().toLowerCase();

    if (!fullName || !emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "fullName, emailOrPhone and password are required",
        data: {},
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
        data: {},
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        data: {},
      });
    }

    if (await User.findOne({ emailOrPhone })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
        data: {},
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const teacher = await User.create({
      fullName,
      emailOrPhone,
      password,
      role: "teacher", // hard-coded, never taken from req.body
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    const link = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    let emailSent = true;
    try {
      await sendMail({
        to: teacher.emailOrPhone,
        subject: "Your ExamPrep NG teacher account",
        html: `<h2>Hello ${teacher.fullName},</h2>
               <p>An admin created a teacher account for you. Verify your email:</p>
               <p><a href="${link}">${link}</a></p>`,
      });
    } catch (e) {
      emailSent = false;
      console.error("TEACHER EMAIL ERROR:", e);
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Teacher account created. A verification email has been sent."
        : "Teacher account created, but the verification email failed. Use resend-verification.",
      data: {
        teacher: {
          id: teacher._id,
          fullName: teacher.fullName,
          emailOrPhone: teacher.emailOrPhone,
          role: teacher.role,
        },
      },
    });
  } catch (error) {
    console.error("CREATE TEACHER ERROR:", error);
    return res.status(500).json({ success: false, message: error.message, data: {} });
  }
};