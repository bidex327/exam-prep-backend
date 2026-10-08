
import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js"; // still used by login
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

    // Verification is sent by email, so require a valid email
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

    // Generate verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    const user = await User.create({
      fullName,
      emailOrPhone,
      password,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // Send the verification email
    const link = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    try {
      await sendMail({
        to: user.emailOrPhone,
        subject: "Verify your ExamPrep NG email",
        html: `
          <h2>Welcome to ExamPrep NG, ${user.fullName}!</h2>
          <p>Click the link below to verify your email address:</p>
          <p><a href="${link}">${link}</a></p>
          <p>This link expires in 24 hours.</p>
        `,
      });
    } catch (mailError) {
      console.error("VERIFICATION EMAIL ERROR:", mailError);
      return res.status(201).json({
        success: true,
        message:
          "Account created, but we could not send the verification email. Please use resend-verification.",
        data: { user: { id: user._id, emailOrPhone: user.emailOrPhone } },
      });
    }

    // NOTE: no JWT is returned here. The user must verify first, then log in.
    return res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
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

    // Find a user with this token that has not expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    }).select("+verificationToken +verificationTokenExpiry");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
        data: {},
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;        // invalidate the token
    user.verificationTokenExpiry = undefined;
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

    // Generic response so this endpoint can't be used to discover registered emails
    const genericResponse = {
      success: true,
      message: "If this account exists and is not verified, a new verification email has been sent.",
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

    // Always generate a NEW token (never reuse an expired one)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const link = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    await sendMail({
      to: user.emailOrPhone,
      subject: "Verify your ExamPrep NG email",
      html: `
        <h2>Hello ${user.fullName},</h2>
        <p>Here is your new verification link:</p>
        <p><a href="${link}">${link}</a></p>
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

    // Block login until the email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please check your inbox or request a new verification link.",
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
    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};