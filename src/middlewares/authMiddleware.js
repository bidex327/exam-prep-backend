import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ======================================================
// PROTECT MIDDLEWARE
// ======================================================
// This middleware protects routes that require a logged-in
// user.
//
// It expects the client to send:
// Authorization: Bearer <token>
//
// If the token is valid, the authenticated user is attached
// to req.user so other controllers can access the user.
// ======================================================

const protect = async (req, res, next) => {
  try {
    // Get the Authorization header from the request.
    const authHeader = req.headers.authorization;

    // Check if the Authorization header exists
    // and starts with "Bearer ".
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        data: {},
      });
    }

    // Extract the JWT token.
    // Example:
    // "Bearer abc123" → "abc123"
    const token = authHeader.split(" ")[1];

    // Verify the token using the secret key stored
    // in the environment variables.
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    // Find the user whose ID was stored inside the token.
    const user = await User.findById(decoded.id);

    // If the user no longer exists, reject the request.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
        data: {},
      });
    }

    // Attach the authenticated user to the request.
    //
    // Controllers can now access:
    // req.user
    //
    // For example:
    // req.user._id
    req.user = user;

    // Continue to the next middleware/controller.
    next();
  } catch (error) {
    // Handle invalid, expired, or malformed tokens.
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      data: {},
    });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
  }
  next();
};

// Export the middleware so other route files
// can import and use it.
export default protect;