import User from "../models/User.js";
import Question from "../models/question.js";
import Exam from "../models/Exam.js";

// GET /api/admin/dashboard
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalQuestions,
      totalExams,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),
      Question.countDocuments(),
      Exam.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin dashboard retrieved successfully",
      data: {
        admin: {
          id: req.user._id || req.user.id,
          fullName: req.user.fullName,
          role: req.user.role,
        },
        summary: {
          totalStudents,
          totalTeachers,
          totalAdmins,
          totalQuestions,
          totalExams,
        },
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve admin dashboard",
      data: {},
    });
  }
};
