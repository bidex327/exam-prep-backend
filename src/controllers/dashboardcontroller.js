
import mongoose from "mongoose";
import User from "../models/User.js";
import PracticeSession from "../models/PracticeSession.js";
import Attempt from "../models/Attempt.js";
import Topic from "../models/Topic.js";
import Question from "../models/question.js";

export const getDashboard = async (req, res) => {
  try {
    const now = new Date();

    // Start of this week (Monday)
    const thisWeekStart = new Date(now);
    thisWeekStart.setHours(0, 0, 0, 0);

    const day = thisWeekStart.getDay();
    const daysSinceMonday = (day + 6) % 7;

    thisWeekStart.setDate(
      thisWeekStart.getDate() - daysSinceMonday
    );

    // Start of last week (Monday)
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // End of last week (Sunday)
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(
      lastWeekEnd.getMilliseconds() - 1
    );

    // Get student information
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

    // Get this week's completed attempts
    const thisWeekAttempts = await Attempt.find({
      userId: user._id,
      status: "completed",
      submittedAt: {
        $gte: thisWeekStart,
        $lte: now,
      },
    });

    // Get last week's completed attempts
    const lastWeekAttempts = await Attempt.find({
      userId: user._id,
      status: "completed",
      submittedAt: {
        $gte: lastWeekStart,
        $lte: lastWeekEnd,
      },
    });

    // Calculate questions completed this week
    const thisWeekQuestions = thisWeekAttempts.reduce(
      (total, attempt) => total + attempt.totalQuestions,
      0
    );

    // Calculate questions completed last week
    const lastWeekQuestions = lastWeekAttempts.reduce(
      (total, attempt) => total + attempt.totalQuestions,
      0
    );

    // Calculate correct answers this week
    const thisWeekCorrect = thisWeekAttempts.reduce(
      (total, attempt) => total + attempt.correctCount,
      0
    );

    // Calculate correct answers last week
    const lastWeekCorrect = lastWeekAttempts.reduce(
      (total, attempt) => total + attempt.correctCount,
      0
    );

    // Calculate weekly accuracy
    const thisWeekAccuracy =
      thisWeekQuestions > 0
        ? Math.round(
            (thisWeekCorrect / thisWeekQuestions) * 100
          )
        : 0;

    const lastWeekAccuracy =
      lastWeekQuestions > 0
        ? Math.round(
            (lastWeekCorrect / lastWeekQuestions) * 100
          )
        : 0;

    // Calculate accuracy progress
    const accuracyProgress =
      thisWeekAccuracy - lastWeekAccuracy;

    // Calculate questions completed progress
    const questionsCompletedProgress =
      thisWeekQuestions - lastWeekQuestions;

    // Get distinct days with completed attempts this week
    const thisWeekStudyDays = new Set(
      thisWeekAttempts
        .filter((attempt) => attempt.submittedAt)
        .map((attempt) => {
          const date = new Date(attempt.submittedAt);

          return [
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          ].join("-");
        })
    );

    // Get distinct days with completed attempts last week
    const lastWeekStudyDays = new Set(
      lastWeekAttempts
        .filter((attempt) => attempt.submittedAt)
        .map((attempt) => {
          const date = new Date(attempt.submittedAt);

          return [
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          ].join("-");
        })
    );

    // Calculate change in active study days
    const studyStreakProgress =
      thisWeekStudyDays.size - lastWeekStudyDays.size;

    // Calculate time spent this week
    const thisWeekTimeMs = thisWeekAttempts.reduce(
      (total, attempt) => {
        if (
          attempt.startedAt &&
          attempt.submittedAt &&
          attempt.submittedAt >= attempt.startedAt
        ) {
          return (
            total +
            (attempt.submittedAt - attempt.startedAt)
          );
        }

        return total;
      },
      0
    );

    // Calculate time spent last week
    const lastWeekTimeMs = lastWeekAttempts.reduce(
      (total, attempt) => {
        if (
          attempt.startedAt &&
          attempt.submittedAt &&
          attempt.submittedAt >= attempt.startedAt
        ) {
          return (
            total +
            (attempt.submittedAt - attempt.startedAt)
          );
        }

        return total;
      },
      0
    );

    // Convert practice time to minutes
    const thisWeekTimeMinutes = Math.round(
      thisWeekTimeMs / 60000
    );

    const lastWeekTimeMinutes = Math.round(
      lastWeekTimeMs / 60000
    );

    // Calculate practice time progress
    const timeSpentPracticingProgress =
      thisWeekTimeMinutes - lastWeekTimeMinutes;

    // Get this student's practice sessions
    const practiceSessions = await PracticeSession.find({
      studentId: user._id,
    })
      .populate("topicId", "name")
      .sort({ date: -1 });

    // Get the most recent practice session
    const latestPracticeSession = practiceSessions[0] || null;

    const currentTopic = latestPracticeSession
      ? latestPracticeSession.topicId
      : null;

    // Get the five most recent completed attempts
    const recentAttempts = await Attempt.find({
      userId: user._id,
      status: "completed",
    })
      .populate("examId", "name code")
      .populate("subjectId", "name")
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean();

    // Collect unique question IDs from recent attempts
    const recentQuestionIds = [
      ...new Set(
        recentAttempts.flatMap((attempt) =>
          (attempt.questionIds || []).map((questionId) =>
            questionId.toString()
          )
        )
      ),
    ];

    // Retrieve the topics associated with those questions
    const recentQuestions = await Question.find({
      _id: {
        $in: recentQuestionIds,
      },
    })
      .select("_id topicId")
      .populate("topicId", "name")
      .lean();

    // Create a lookup between question IDs and topics
    const questionTopicMap = new Map(
      recentQuestions.map((question) => [
        question._id.toString(),
        question.topicId,
      ])
    );

    // Get the subject from the most recent completed attempt
    const latestAttempt = recentAttempts[0] || null;

    const currentSubject = latestAttempt
      ? latestAttempt.subjectId
      : null;

    // Calculate topic performance across all practice sessions
    const topicPerformance = await PracticeSession.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(
            user._id.toString()
          ),
          score: {
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$topicId",
          totalQuestions: {
            $sum: "$numberOfQuestions",
          },
          totalCorrect: {
            $sum: "$score",
          },
        },
      },
      {
        $project: {
          totalQuestions: 1,
          totalCorrect: 1,
          accuracy: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      "$totalCorrect",
                      "$totalQuestions",
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $match: {
          accuracy: {
            $lt: 50,
          },
        },
      },
      {
        $sort: {
          accuracy: 1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    // Retrieve topic names for weak topics
    const weakTopicIds = topicPerformance.map(
      (item) => item._id
    );

    const weakTopicDetails = await Topic.find({
      _id: {
        $in: weakTopicIds,
      },
    }).select("name");

    // Add topic names to the performance results
    const weakTopics = topicPerformance.map(
      (performance) => {
        const topic = weakTopicDetails.find(
          (item) =>
            item._id.toString() ===
            performance._id.toString()
        );

        return {
          topicId: performance._id,
          topic: topic ? topic.name : "Unknown topic",
          totalQuestions: performance.totalQuestions,
          correctAnswers: performance.totalCorrect,
          accuracy: performance.accuracy,
        };
      }
    );

    // Build dashboard response
    return res.status(200).json({
      success: true,
      message: "Dashboard fetched successfully",
      data: {
        student: user.fullName,
        targetExam: user.targetExam,
        selectedSubjects: user.selectedSubjects,

        questionsAttempted: user.questionsAttempted,
        studyStreak: user.studyStreak,

        progressPercentage: thisWeekAccuracy,

        progress: {
          accuracy: thisWeekAccuracy,
          accuracyProgress,

          questionsCompleted: thisWeekQuestions,
          questionsCompletedProgress,

          studyStreak: user.studyStreak,

          // This represents the change in active study days,
          // not the actual consecutive-day streak change.
          studyStreakProgress,

          timeSpentPracticing: thisWeekTimeMinutes,
          timeSpentPracticingProgress,

          date: now.toISOString().split("T")[0],
        },

        currentSubject,
        currentTopic,

        // Topics with combined accuracy below 50%
        weakTopics,

        // Practice sessions
        practiceSessions: practiceSessions.map(
          (session) => ({
            topic: session.topicId,
            numberOfQuestions: session.numberOfQuestions,
            score: session.score,
            accuracy: session.accuracy,
            date: session.date,
          })
        ),

        // Recent activity history
        recentAttempts: recentAttempts.map((attempt) => ({
          _id: attempt._id,
          exam: attempt.examId,
          subject: attempt.subjectId,

          // Include all unique topics associated with this attempt
          topics: [
            ...new Map(
              (attempt.questionIds || [])
                .map((questionId) =>
                  questionTopicMap.get(
                    questionId.toString()
                  )
                )
                .filter(Boolean)
                .map((topic) => [
                  topic._id.toString(),
                  topic,
                ])
            ).values(),
          ],

          mode: attempt.mode,
          status: attempt.status,
          totalQuestions: attempt.totalQuestions,
          correctCount: attempt.correctCount,
          score: attempt.score,
          accuracy: attempt.accuracy,
          submittedAt: attempt.submittedAt,
        })),
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
