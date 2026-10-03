import PracticeSession from "../models/PracticeSession.js";

export const getPracticeSessions = async (req, res) => {
  try {
    const practiceSessions = await PracticeSession.find({
      studentId: req.user._id,
    })
      .populate("topicId", "name")
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: "Practice sessions fetched successfully",
      data: practiceSessions.map((session) => ({
        topic: session.topicId,
        numberOfQuestions: session.numberOfQuestions,
        score: session.score,
        accuracy: session.accuracy,
        date: session.date,
      })),
    });
  } catch (error) {
    console.error("Practice sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch practice sessions",
      error: error.message,
      data: {},
    });
  }
};