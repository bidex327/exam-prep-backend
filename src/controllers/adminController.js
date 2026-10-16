
import User from "../models/User.js";
import Question from "../models/question.js";
import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";

// GET /api/admin/dashboard
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalQuestions,
      publishedItems,
      drafts,
      totalSubjects,
      totalExams,
      examDistribution,
      subjectDistribution,
      recentQuestions,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),

      Question.countDocuments(),

      Question.countDocuments({ status: "published" }),
      Question.countDocuments({ status: "draft" }),

      Subject.countDocuments({ isActive: true }),
      Exam.countDocuments(),

      // Number of questions grouped by exam
      Question.aggregate([
        {
          $group: {
            _id: "$examId",
            questionCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: Exam.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "exam",
          },
        },
        {
          $unwind: {
            path: "$exam",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            examId: "$_id",
            examName: { $ifNull: ["$exam.name", "Unknown exam"] },
            examCode: "$exam.code",
            questionCount: 1,
          },
        },
        { $sort: { examName: 1 } },
      ]),

      // Number of questions grouped by subject
      Question.aggregate([
        {
          $group: {
            _id: "$subjectId",
            questionCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: Subject.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "subject",
          },
        },
        {
          $unwind: {
            path: "$subject",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            subjectId: "$_id",
            subjectName: {
              $ifNull: ["$subject.name", "Unknown subject"],
            },
            examId: "$subject.examId",
            questionCount: 1,
          },
        },
        { $sort: { subjectName: 1 } },
      ]),

      // Most recently created questions
      Question.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("questionText status createdAt examId subjectId topicId")
        .populate("examId", "name code")
        .populate("subjectId", "name")
        .populate("topicId", "name")
        .lean(),
    ]);

    const recentActivity = recentQuestions.map((question) => ({
      id: question._id,
      questionText: question.questionText,
      exam: question.examId?.name || "Unknown exam",
      examCode: question.examId?.code || null,
      subject: question.subjectId?.name || "Unknown subject",
      topic: question.topicId?.name || "Unknown topic",
      status: question.status || "unknown",
      createdAt: question.createdAt,
    }));

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
          publishedItems,
          drafts,
          totalSubjects,
          totalExams,
        },

        examDistribution,
        subjectDistribution,
        recentActivity,
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
