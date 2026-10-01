import User from "../models/User.js";

export const getdashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("targetExam")
      .populate("selectedSubjects", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
        data: {}
      });
    }

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
        recentAttempts: []
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
      data: {}
    });
  }
};