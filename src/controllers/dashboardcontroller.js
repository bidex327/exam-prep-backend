
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

    // Start and end of last week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(
      lastWeekEnd.getMilliseconds() - 1
    );

    // Get student information
    const user = await User.findById(req.user._id)
      .populate("targetExam")
      .populate("selectedSubjects", "name icon");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
        data: {},
      });
    }

    // Get unfinished attempts for Continue Practicing
    const inProgressAttempts = await Attempt.find({
      userId: user._id,
      status: "in-progress",
    })
      .populate("examId", "name code")
      .populate("subjectId", "name icon")
      .sort({ startedAt: -1 })
      .lean();

    const resumableAttempts = inProgressAttempts.map(
      (attempt) => {
        const deadline =
          attempt.durationMinutes != null &&
          attempt.startedAt
            ? new Date(
                new Date(attempt.startedAt).getTime() +
                  attempt.durationMinutes * 60 * 1000
              )
            : null;

        return {
          attemptId: attempt._id,
          exam: attempt.examId,
          subject: attempt.subjectId,
          mode: attempt.mode,
          status: attempt.status,
          totalQuestions: attempt.totalQuestions,
          startedAt: attempt.startedAt,
          durationMinutes: attempt.durationMinutes,
          deadline,
          isExpired:
            deadline !== null && now >= deadline,
        };
      }
    );

    // Get this week's completed attempts
    const thisWeekAttempts = await Attempt.find({
      userId: user._id,
      status: {
        $in: ["completed", "auto-submitted"],
      },
      submittedAt: {
        $gte: thisWeekStart,
        $lte: now,
      },
    });

    // Get last week's completed attempts
    const lastWeekAttempts = await Attempt.find({
      userId: user._id,
      status: {
        $in: ["completed", "auto-submitted"],
      },
      submittedAt: {
        $gte: lastWeekStart,
        $lte: lastWeekEnd,
      },
    });

    // Calculate questions completed
    const thisWeekQuestions = thisWeekAttempts.reduce(
      (total, attempt) =>
        total + (attempt.totalQuestions || 0),
      0
    );

    const lastWeekQuestions = lastWeekAttempts.reduce(
      (total, attempt) =>
        total + (attempt.totalQuestions || 0),
      0
    );

    // Calculate correct answers
    const thisWeekCorrect = thisWeekAttempts.reduce(
      (total, attempt) =>
        total + (attempt.correctCount || 0),
      0
    );

    const lastWeekCorrect = lastWeekAttempts.reduce(
      (total, attempt) =>
        total + (attempt.correctCount || 0),
      0
    );

    // Weekly accuracy: null when no questions were completed
    const thisWeekAccuracy =
      thisWeekQuestions > 0
        ? Math.round(
            (thisWeekCorrect / thisWeekQuestions) * 100
          )
        : null;

    const lastWeekAccuracy =
      lastWeekQuestions > 0
        ? Math.round(
            (lastWeekCorrect / lastWeekQuestions) * 100
          )
        : null;

    // Accuracy change is unavailable if either week has no data
    const accuracyProgress =
      thisWeekAccuracy !== null &&
      lastWeekAccuracy !== null
        ? thisWeekAccuracy - lastWeekAccuracy
        : null;

    const questionsCompletedProgress =
      thisWeekQuestions - lastWeekQuestions;

    // Count distinct study days this week
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

    // Count distinct study days last week
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

    const studyStreakProgress =
      thisWeekStudyDays.size - lastWeekStudyDays.size;

    // Get this student's practice sessions
    const practiceSessions = await PracticeSession.find({
      user: user._id,
    })
      .populate("subjectId", "name icon")
      .populate("topicId", "name icon")
      .sort({ startedAt: -1 });

    const completedPracticeSessions =
      practiceSessions.filter(
        (session) => session.status === "completed"
      );

    const practiceSessionsCompleted =
      completedPracticeSessions.length;

    // Calculate completed practice time this week
    const thisWeekTimeSeconds =
      completedPracticeSessions.reduce(
        (total, session) => {
          const sessionDate = new Date(
            session.completedAt || session.startedAt
          );

          if (
            !Number.isNaN(sessionDate.getTime()) &&
            sessionDate >= thisWeekStart &&
            sessionDate <= now
          ) {
            return total + (session.durationSeconds || 0);
          }

          return total;
        },
        0
      );

    // Calculate completed practice time last week
    const lastWeekTimeSeconds =
      completedPracticeSessions.reduce(
        (total, session) => {
          const sessionDate = new Date(
            session.completedAt || session.startedAt
          );

          if (
            !Number.isNaN(sessionDate.getTime()) &&
            sessionDate >= lastWeekStart &&
            sessionDate <= lastWeekEnd
          ) {
            return total + (session.durationSeconds || 0);
          }

          return total;
        },
        0
      );

    const thisWeekTimeMinutes = Math.round(
      thisWeekTimeSeconds / 60
    );

    const lastWeekTimeMinutes = Math.round(
      lastWeekTimeSeconds / 60
    );

    const timeSpentPracticingProgress =
      thisWeekTimeMinutes - lastWeekTimeMinutes;

    // Count completed practice sessions this week
    const thisWeekPracticeSessions =
      completedPracticeSessions.filter((session) => {
        const sessionDate = new Date(
          session.completedAt || session.startedAt
        );

        return (
          !Number.isNaN(sessionDate.getTime()) &&
          sessionDate >= thisWeekStart &&
          sessionDate <= now
        );
      }).length;

    // Count completed practice sessions last week
    const lastWeekPracticeSessions =
      completedPracticeSessions.filter((session) => {
        const sessionDate = new Date(
          session.completedAt || session.startedAt
        );

        return (
          !Number.isNaN(sessionDate.getTime()) &&
          sessionDate >= lastWeekStart &&
          sessionDate <= lastWeekEnd
        );
      }).length;

    const practiceSessionsProgress =
      thisWeekPracticeSessions -
      lastWeekPracticeSessions;

    // Current topic from the most recent practice session
    const latestPracticeSession =
      practiceSessions[0] || null;

    const currentTopic = latestPracticeSession
      ? latestPracticeSession.topicId
      : null;

    // Get five most recent completed attempts
    const recentAttempts = await Attempt.find({
      userId: user._id,
      status: {
        $in: ["completed", "auto-submitted"],
      },
    })
      .populate("examId", "name code")
      .populate("subjectId", "name icon")
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean();

    // Collect unique question IDs
    const recentQuestionIds = [
      ...new Set(
        recentAttempts.flatMap((attempt) =>
          (attempt.questionIds || []).map((questionId) =>
            questionId.toString()
          )
        )
      ),
    ];

    // Retrieve topics associated with recent questions
    const recentQuestions = await Question.find({
      _id: {
        $in: recentQuestionIds,
      },
    })
      .select("_id topicId")
      .populate("topicId", "name")
      .lean();

    const questionTopicMap = new Map(
      recentQuestions.map((question) => [
        question._id.toString(),
        question.topicId,
      ])
    );

    // Subject from the most recent completed attempt
    const latestAttempt = recentAttempts[0] || null;

    const currentSubject = latestAttempt
      ? latestAttempt.subjectId
      : null;

    // Calculate overall performance for each subject
    const subjectPerformance = await Attempt.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(
            user._id.toString()
          ),
          status: {
            $in: ["completed", "auto-submitted"],
          },
        },
      },
      {
        $group: {
          _id: "$subjectId",
          totalQuestions: {
            $sum: "$totalQuestions",
          },
          correctAnswers: {
            $sum: "$correctCount",
          },
          totalAttempts: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          subjectId: "$_id",
          totalQuestions: 1,
          correctAnswers: 1,
          totalAttempts: 1,
          accuracy: {
            $cond: [
              { $gt: ["$totalQuestions", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$correctAnswers",
                          "$totalQuestions",
                        ],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $sort: {
          accuracy: -1,
        },
      },
    ]);

    // Retrieve subject names for the performance results
    const subjectIds = subjectPerformance.map(
      (item) => item.subjectId
    );

    const subjectDetails = await mongoose
      .model("Subject")
      .find({
        _id: { $in: subjectIds },
      })
      .select("name icon");

    const subjectNameMap = new Map(
      subjectDetails.map((subject) => [
        subject._id.toString(),
        {
          name: subject.name,
          icon: subject.icon,
        },
      ])
    );

    const formattedSubjectPerformance =
      subjectPerformance.map((performance) => {
        const subjectDetailsForId = subjectNameMap.get(
          performance.subjectId.toString()
        );

        return {
          subjectId: performance.subjectId,
          subject: subjectDetailsForId
            ? subjectDetailsForId.name
            : "Unknown subject",
          icon: subjectDetailsForId
            ? subjectDetailsForId.icon
            : "",
          totalQuestions: performance.totalQuestions,
          correctAnswers: performance.correctAnswers,
          totalAttempts: performance.totalAttempts,
          accuracy: performance.accuracy,
        };
      });

    // Calculate topic performance from completed practice sessions
    const topicPerformance =
      await PracticeSession.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(
              user._id.toString()
            ),
            status: "completed",
          },
        },
        {
          $set: {
            effectiveTopicBreakdown: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $ifNull: ["$topicBreakdown", []],
                      },
                    },
                    0,
                  ],
                },
                "$topicBreakdown",
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$topicId", null] },
                        {
                          $lte: [
                            {
                              $size: {
                                $ifNull: ["$topicIds", []],
                              },
                            },
                            1,
                          ],
                        },
                      ],
                    },
                    [
                      {
                        topicId: "$topicId",
                        numberOfQuestions:
                          "$numberOfQuestions",
                        correctCount: "$score",
                      },
                    ],
                    [],
                  ],
                },
              ],
            },
          },
        },
        {
          $unwind: "$effectiveTopicBreakdown",
        },
        {
          $match: {
            "effectiveTopicBreakdown.topicId": {
              $ne: null,
            },
            "effectiveTopicBreakdown.correctCount": {
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$effectiveTopicBreakdown.topicId",
            totalQuestions: {
              $sum:
                "$effectiveTopicBreakdown.numberOfQuestions",
            },
            totalCorrect: {
              $sum:
                "$effectiveTopicBreakdown.correctCount",
            },
          },
        },
        {
          $project: {
            totalQuestions: 1,
            totalCorrect: 1,
            accuracy: {
              $cond: [
                { $gt: ["$totalQuestions", 0] },
                {
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
                null,
              ],
            },
          },
        },
        {
          $match: {
            accuracy: { $lte: 50 },
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

    // Retrieve names for weak topics
    const weakTopicIds = topicPerformance.map(
      (item) => item._id
    );

    const weakTopicDetails = await Topic.find({
      _id: {
        $in: weakTopicIds,
      },
    }).select("name icon");

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
          icon: topic ? topic.icon : "",
          totalQuestions: performance.totalQuestions,
          correctAnswers: performance.totalCorrect,
          accuracy: performance.accuracy,
        };
      }
    );

    // Recent activity: completed practice sessions only
    const recentActivities = practiceSessions
      .filter((session) => session.status === "completed")
      .map((session) => ({
        icon: session.subjectId?.icon || "book-open",
        subject:
          session.subjectId?.name || "Unknown subject",
        topic:
          session.topicId?.name ||
          (session.topicIds?.length
            ? "Multiple topics"
            : null),
        questions: session.numberOfQuestions,
        score: session.score ?? null,
        date:
          session.completedAt ||
          session.startedAt ||
          null,
      }));

    // Build dashboard response
    return res.status(200).json({
      success: true,
      message: "Dashboard fetched successfully",
      data: {
        student: user.fullName,
        profilePicture: user.profilePicture || "",
        targetExam: user.targetExam,
        selectedSubjects: user.selectedSubjects,

        // Unfinished attempts for Continue Practicing
        inProgressAttempts: resumableAttempts,

        questionsAttempted: user.questionsAttempted,
        studyStreak: user.studyStreak,
        practiceSessionsCompleted,
        recentActivities,

        progressPercentage: thisWeekAccuracy,

        progress: {
          accuracy: thisWeekAccuracy,
          accuracyProgress,
          questionsCompleted: thisWeekQuestions,
          questionsCompletedProgress,
          studyStreak: user.studyStreak,
          studyStreakProgress,
          practiceSessionsCompleted,
          timeSpentPracticing: thisWeekTimeMinutes,
          timeSpentPracticingProgress,
          practiceSessions: thisWeekPracticeSessions,
          practiceSessionsProgress,
          date: now.toISOString().split("T")[0],
        },

        currentSubject,
        currentTopic,
        subjectPerformance: formattedSubjectPerformance,
        weakTopics,

        practiceSessions: practiceSessions.map(
          (session) => ({
            sessionId: session._id,
            subject: session.subjectId?.name ?? null,
            topic: session.topicId?.name ?? null,
            practiceMode: session.mode,
            status: session.status,
            numberOfQuestions:
              session.numberOfQuestions,
            score: session.score ?? null,
            accuracy: session.accuracy ?? null,
            durationSeconds: session.durationSeconds,
            date: session.startedAt,
            completedAt: session.completedAt ?? null,
          })
        ),

        recentAttempts: recentAttempts.map(
          (attempt) => ({
            _id: attempt._id,
            exam: attempt.examId,
            subject: attempt.subjectId,
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
          })
        ),
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
