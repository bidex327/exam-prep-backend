import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendMail } from "../config/sendMailDb.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const link = `${process.env.CLIENT_URL}/students/authentication/verification.html?token=${verificationToken}`;

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

    // Google-only accounts must use Google Sign-In.
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "This account does not have a password. Please sign in with Google.",
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
      message: "An error occurred while logging in",
      data: {},
    });
  }
};



// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const emailOrPhone = req.body.emailOrPhone?.trim().toLowerCase();

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
        data: {},
      });
    }

    const genericResponse = {
      success: true,
      message:
        "If an account exists with this email address, a password reset link will be sent.",
      data: {},
    };

    // Find the account without revealing whether it exists.
    const user = await User.findOne({ emailOrPhone });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate a secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash of the token.
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // The token expires in 15 minutes.
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    const resetLink =
      `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
      await sendMail({
        to: user.emailOrPhone,
        subject: "Reset your ExamPrep NG password",
        html: `
          <h2>Hello ${user.fullName},</h2>
          <p>We received a request to reset your ExamPrep NG password.</p>
          <p>Click the link below to choose a new password:</p>
          <p>
            <a href="${resetLink}">Reset Password</a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
      });
    } catch (mailError) {
      console.error("PASSWORD RESET EMAIL ERROR:", mailError);

      // Remove the reset token if the email could not be sent.
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Unable to send the password reset email. Please try again.",
        data: {},
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      data: {},
    });
  }
};


// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
        data: {},
      });
    }

    // Enforce a minimum password length.
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        data: {},
      });
    }

    // Hash the token received from the user.
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find the account using the hashed token and check expiration.
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
        data: {},
      });
    }

    // Update the password. The User model hashes it before saving.
    user.password = password;

    // Invalidate the reset token so it cannot be reused.
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
      data: {},
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting your password",
      data: {},
    });
  }
};


// POST /api/auth/google
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // 1. Check that the Google ID token was provided.
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
        data: {},
      });
    }

    // 2. Verify the ID token with Google.
    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      payload = ticket.getPayload();
    } catch (error) {
      console.error("GOOGLE TOKEN VERIFICATION ERROR:", error.message);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google ID token",
        data: {},
      });
    }

    // 3. Confirm that Google supplied the required identity information.
    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account could not be verified",
        data: {},
      });
    }

    // 4. Extract the verified Google account details.
    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const fullName = payload.name || email.split("@")[0];

    // 5. Find an account already linked to this Google identity.
    let user = await User.findOne({ googleId });

    if (!user) {
      // 6. Prevent automatic linking to an existing account.
      const existingUser = await User.findOne({
        emailOrPhone: email,
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists. Please sign in using your existing account before linking Google.",
          data: {},
        });
      }

      // 7. Create a new Google-authenticated student account.
      user = await User.create({
        fullName,
        emailOrPhone: email,
        googleId,
        emailVerified: true,
        role: "student",
      });
    }

    // 8. Generate the application's JWT.
    const token = generateToken(user._id);

    // 9. Return the authenticated user and JWT.
    return res.status(200).json({
      success: true,
      message: "Google sign-in successful",
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
    // 10. Handle database conflicts.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email or Google identity already exists.",
        data: {},
      });
    }

    // 11. Handle unexpected server or database errors.
    console.error("GOOGLE LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during Google sign-in.",
      data: {},
    });
  }
};

