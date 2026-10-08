// ======================================================
// TEACHER ONLY MIDDLEWARE
// ======================================================
// This middleware checks whether the authenticated user
// is a teacher.
//
// IMPORTANT:
// The protect middleware must run before this middleware.
//
// Flow:
//
// Request
//    ↓
// protect
//    ↓
// JWT verified
//    ↓
// req.user created
//    ↓
// teacherOnly
//    ↓
// Check req.user.role
//    ↓
// Teacher → Continue
// Student → Reject
// ======================================================

const teacherOnly = (req, res, next) => {
  // Check the role of the authenticated user.
  if (!req.user || req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only teachers can manage questions",
      data: {},
    });
  }

  // The authenticated user is a teacher.
  // Continue to the next middleware/controller.
  next();
};

export default teacherOnly;