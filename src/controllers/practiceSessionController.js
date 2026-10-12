import PracticeSession from "../models/PracticeSession.js";

export const getPracticeSessions = async (req, res) => {
try {
const practiceSessions = await PracticeSession.find({
user: req.user._id,
})
.populate("subjectId", "name icon")
.populate("topicId", "name")
.sort({ createdAt: -1 });


return res.status(200).json({
  success: true,
  message: "Practice sessions fetched successfully",
  data: practiceSessions.map((session) => ({
    _id: session._id,

    subject: session.subjectId
      ? {
          _id: session.subjectId._id,
          name: session.subjectId.name,
          icon: session.subjectId.icon,
        }
      : null,

    topic: session.topicId
      ? {
          _id: session.topicId._id,
          name: session.topicId.name,
        }
      : null,

    mode: session.mode,
    numberOfQuestions: session.numberOfQuestions,
    score: session.score,
    accuracy: session.accuracy,
    durationSeconds: session.durationSeconds,
    date: session.createdAt,
  })),
});


} catch (error) {
console.error("Practice sessions error:", error);


return res.status(500).json({
  success: false,
  message: "Failed to fetch practice sessions",
  data: {},
});

}
};
