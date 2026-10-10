import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

// ======================================================
// PROTECT
// ======================================================
// Verifies the JWT token and identifies the logged-in user.
// ======================================================

const protect = async (req, res, next) => {
try {
let token;


// Read the token from the Authorization header.
const authHeader = req.headers.authorization;

if (authHeader && authHeader.startsWith("Bearer ")) {
  token = authHeader.split(" ")[1];
}

// Reject requests without a token.
if (!token) {
  return res.status(401).json({
    success: false,
    message: "Not authorized. Please log in.",
    data: {},
  });
}

// Verify the token.
const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET_KEY
);

// Find the user identified by the token.
const user = await User.findById(decoded.id);

if (!user) {
  return res.status(401).json({
    success: false,
    message: "Email not verified. Please verify your email to access this resource.",
    data: {},
  });
}

// Attach the authenticated user to the request.
req.user = user;

next();


} catch (error) {
console.error("Authentication error:", error.message);


return res.status(401).json({
  success: false,
  message: "Invalid or expired token. Please log in again.",
  data: {},
});


}
};

// ======================================================
// AUTHORIZE
// ======================================================
// Restricts access to users with specified roles.
// Example: authorize("admin", "teacher")
// ======================================================

const authorize = (...roles) => {
return (req, res, next) => {
// Ensure the user has been authenticated first.
if (!req.user) {
return res.status(401).json({
success: false,
message: "Authentication required.",
data: {},
});
}


// Check whether the user's role is permitted.
if (!roles.includes(req.user.role)) {
  return res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
    data: {},
  });
}

next();


};
};

// Export both middleware functions.
export { authorize };
export default protect;
