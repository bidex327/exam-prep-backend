import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendMail } from "../config/sendMailDb.js";

// POST /api/auth/register
export const register = async (req, res) => {
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

    // Email verification requires an actual email address.
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);

    if (!isEmail) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required to verify your account",
        data: {},
      });
    }

    const existingUser = await User.findOne({ emailOrPhone });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email or phone already exists",
        data: {},
      });
    }

    // Generate a verification token valid for 24 hours.
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires =
      Date.now() + 24 * 60 * 60 * 1000;

    const user = await User.create({
      fullName,
      emailOrPhone,
      password,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationTokenExpires,
    });

    const link = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    try {
      await sendMail({
        to: user.emailOrPhone,
        subject: "Verify your ExamPrep NG email",
        html: `
          <h2>Welcome to ExamPrep NG, ${user.fullName}!</h2>
          <p>Click the link below to verify your email address:</p>
          <p>
            <a href="${link}">${link}</a>
          </p>
          <p>This link expires in 24 hours.</p>
        `,
      });
    } catch (mailError) {
      console.error("VERIFICATION EMAIL ERROR:", mailError);

      return res.status(201).json({
        success: true,
        message:
          "Account created, but we could not send the verification email. Please use resend-verification.",
        data: {
          user: {
            id: user._id,
            emailOrPhone: user.emailOrPhone,
          },
        },
      });
    }

    // Do not return a JWT.
    // The user must verify their email before logging in.
    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          emailOrPhone: user.emailOrPhone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};

// GET /api/auth/verify-email?token=...
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
        data: {},
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
        data: {},
      });
    }

    // Mark the account as verified.
    user.emailVerified = true;

    // Invalidate the token after successful verification.
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
      data: {},
    });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};

// POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const emailOrPhone = req.body.emailOrPhone?.trim().toLowerCase();

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: "emailOrPhone is required",
        data: {},
      });
    }

    const user = await User.findOne({ emailOrPhone });

    // Generic response for accounts that don't exist.
    const genericResponse = {
      success: true,
      message:
        "If this account exists and is not verified, a new verification email has been sent.",
      data: {},
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "This email is already verified. Please log in.",
        data: {},
      });
    }

    // Generate a completely new token.
    const verificationToken = crypto.randomBytes(32).toString("hex");

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires =
      Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const link = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    await sendMail({
      to: user.emailOrPhone,
      subject: "Verify your ExamPrep NG email",
      html: `
        <h2>Hello ${user.fullName},</h2>
        <p>Here is your new verification link:</p>
        <p>
          <a href="${link}">${link}</a>
        </p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { password } = req.body;
    const emailOrPhone = req.body.emailOrPhone?.trim().toLowerCase();

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "emailOrPhone and password are required",
        data: {},
      });
    }

    const user = await User.findOne({ emailOrPhone }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: {},
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: {},
      });
    }

    // User must verify their email before receiving a JWT.
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Email not verified. Please check your inbox or request a new verification link.",
        data: {},
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          emailOrPhone: user.emailOrPhone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};