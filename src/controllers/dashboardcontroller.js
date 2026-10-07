import User from "../models/User.js";
import PracticeSession from "../models/PracticeSession.js";

export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("targetExam")
      .populate("selectedSubjects", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
        data: {},
      });
    }

    // Get this student's practice sessions from the database
    const practiceSessions = await PracticeSession.find({
      studentId: user._id,
    })
      .populate("topicId", "name")
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: "Dashboard fetched successfully",
      data: {
        student: user.fullName,
        targetExam: user.targetExam,
        selectedSubjects: user.selectedSubjects,
        questionsAttempted: user.questionsAttempted,
        studyStreak: user.studyStreak,

        progressPercentage: null,
        currentSubject: null,
        currentTopic: null,

        practiceSessions: practiceSessions.map((session) => ({
          topic: session.topicId,
          numberOfQuestions: session.numberOfQuestions,
          score: session.score,
          accuracy: session.accuracy,
          date: session.date,
        })),

        recentAttempts: [],
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
      error: error.message,
      data: {},
    });
  }
};