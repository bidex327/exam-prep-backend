
import express from "express";

import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleLogin,
} from "../controllers/authController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User registration, login, email verification, and password recovery
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - emailOrPhone
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Test Student
 *               emailOrPhone:
 *                 type: string
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestPass123!
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Invalid registration details
 */
router.post("/register", register);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *               - password
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: ashleyruth751@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestPass123!
 *     responses:
 *       '200':
 *         description: Login successful
 *       '400':
 *         description: Invalid request
 *       '401':
 *         description: Invalid credentials or email not verified
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Sign in with Google
 *     tags: [Authentication]
 *     responses:
 *       '200':
 *         description: Google login successful
 *       '400':
 *         description: Invalid Google login request
 */
router.post("/google", googleLogin);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify a user's email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       '200':
 *         description: Email verified successfully
 *       '400':
 *         description: Invalid or expired verification token
 */
router.get("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend the email verification link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: student@example.com
 *     responses:
 *       '200':
 *         description: Verification email sent successfully
 *       '400':
 *         description: Invalid request
 */
router.post("/resend-verification", resendVerification);




/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: student@example.com
 *     responses:
 *       '200':
 *         description: Password reset instructions sent
 *       '400':
 *         description: Invalid request
 *       '500':
 *         description: Server error
 */
router.post("/forgot-password", forgotPassword);


/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset a user's password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token received by email
 *                 example: your_password_reset_token
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *                 example: NewSecurePassword123
 *     responses:
 *       '200':
 *         description: Password reset successfully
 *       '400':
 *         description: Missing, invalid, or expired reset token
 *       '500':
 *         description: Server error
 */
router.post("/reset-password", resetPassword);



export default router;
