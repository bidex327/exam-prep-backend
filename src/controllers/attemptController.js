import mongoose from "mongoose";

import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import Question from "../models/question.js";
import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import PracticeSession from "../models/PracticeSession.js";
import User from "../models/User.js";

// ======================================================
// START ATTEMPT
// ======================================================

export const startAttempt = async (req, res) => {
try {
const {
examId,
subjectId,
topicId,
numberOfQuestions,
mode,
} = req.body;


// Validate required fields
if (!examId || !subjectId || numberOfQuestions === undefined) {
  return res.status(400).json({
    success: false,
    message:
      "examId, subjectId and numberOfQuestions are required",
    data: {},
  });
}

// Validate ObjectIds
if (
  !mongoose.isValidObjectId(examId) ||
  !mongoose.isValidObjectId(subjectId)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid examId or subjectId",
    data: {},
  });
}

if (topicId && !mongoose.isValidObjectId(topicId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid topicId",
    data: {},
  });
}

// Validate number of questions
const questionCount = Number(numberOfQuestions);

if (!Number.isInteger(questionCount) || questionCount < 1) {
  return res.status(400).json({
    success: false,
    message: "numberOfQuestions must be a positive integer",
    data: {},
  });
}

// Validate mode
const selectedMode = mode || "practice";

if (!["practice", "timed-cbt"].includes(selectedMode)) {
  return res.status(400).json({
    success: false,
    message: "Invalid attempt mode",
    data: {},
  });
}

// Check exam exists
const exam = await Exam.findById(examId);

if (!exam) {
  return res.status(404).json({
    success: false,
    message: "Exam not found",
    data: {},
  });
}

// Check subject belongs to exam
const subject = await Subject.findOne({
  _id: subjectId,
  examId,
});

if (!subject) {
  return res.status(400).json({
    success: false,
    message: "Subject does not belong to the selected exam",
    data: {},
  });
}

// Check topic belongs to subject
if (topicId) {
  const topic = await Topic.findOne({
    _id: topicId,
    subjectId,
  });

  if (!topic) {
    return res.status(400).json({
      success: false,
      message: "Topic does not belong to the selected subject",
      data: {},
    });
  }
}

// Build question filter
const questionFilter = {
  examId: new mongoose.Types.ObjectId(examId),
  subjectId: new mongoose.Types.ObjectId(subjectId),
};

if (topicId) {
  questionFilter.topicId = new mongoose.Types.ObjectId(topicId);
}

// Select random questions
const questions = await Question.aggregate([
  {
    $match: questionFilter,
  },
  {
    $sample: {
      size: questionCount,
    },
  },
  {
    $project: {
      questionText: 1,
      options: {
        label: 1,
        text: 1,
      },
      examId: 1,
      subjectId: 1,
      topicId: 1,
      year: 1,
    },
  },
]);

// Make sure enough questions exist
if (questions.length < questionCount) {
  return res.status(400).json({
    success: false,
    message: `Only ${questions.length} questions are available for this selection`,
    data: {},
  });
}

// Create attempt
const attempt = await Attempt.create({
  userId: req.user._id,
  examId,
  subjectId,
  questionIds: questions.map((question) => question._id),
  mode: selectedMode,
  status: "in-progress",
  totalQuestions: questions.length,
  correctCount: 0,
  score: null,
  accuracy: null,
});

// Return questions without revealing correct answers
return res.status(201).json({
  success: true,
  message: "Attempt started successfully",
  data: {
    attemptId: attempt._id,
    examId: attempt.examId,
    subjectId: attempt.subjectId,
    mode: attempt.mode,
    status: attempt.status,
    totalQuestions: attempt.totalQuestions,
    startedAt: attempt.startedAt,
    questions,
  },
});


} catch (error) {
console.error("START ATTEMPT ERROR:", error);


return res.status(500).json({
  success: false,
  message: "Failed to start attempt",
  data: {},
});


}
};

// ======================================================
// SUBMIT ATTEMPT
// ======================================================

export const submitAttempt = async (req, res) => {
try {
const { id } = req.params;
const { answers } = req.body;

// Validate attempt ID
if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid attempt ID",
    data: {},
  });
}

// Validate answers
if (!Array.isArray(answers)) {
  return res.status(400).json({
    success: false,
    message: "answers must be an array",
    data: {},
  });
}

// Find student's attempt
const attempt = await Attempt.findOne({
  _id: id,
  userId: req.user._id,
});

if (!attempt) {
  return res.status(404).json({
    success: false,
    message: "Attempt not found",
    data: {},
  });
}

// Prevent duplicate submission
if (attempt.status !== "in-progress") {
  return res.status(400).json({
    success: false,
    message: "This attempt has already been submitted",
    data: {},
  });
}

// Make sure this attempt has assigned questions
if (
  !Array.isArray(attempt.questionIds) ||
  attempt.questionIds.length !== attempt.totalQuestions
) {
  return res.status(500).json({
    success: false,
    message: "This attempt does not have valid assigned questions",
    data: {},
  });
}

// Validate submitted question IDs
for (const answer of answers) {
  if (!answer.questionId) {
    return res.status(400).json({
      success: false,
      message: "Each answer must contain a questionId",
      data: {},
    });
  }

  if (!mongoose.isValidObjectId(answer.questionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid questionId",
      data: {},
    });
  }
}

// Prevent duplicate question answers
const submittedQuestionIds = answers.map((answer) =>
  answer.questionId.toString()
);

const uniqueQuestionIds = new Set(submittedQuestionIds);

if (uniqueQuestionIds.size !== submittedQuestionIds.length) {
  return res.status(400).json({
    success: false,
    message: "A question cannot be answered more than once",
    data: {},
  });
}

// Verify questions belong to this exact attempt
const assignedQuestionIds = attempt.questionIds.map((questionId) =>
  questionId.toString()
);

const allQuestionsBelongToAttempt =
  submittedQuestionIds.every((questionId) =>
    assignedQuestionIds.includes(questionId)
  );

if (!allQuestionsBelongToAttempt) {
  return res.status(400).json({
    success: false,
    message:
      "One or more questions do not belong to this attempt",
    data: {},
  });
}

// Get the exact assigned questions
const questions = await Question.find({
  _id: {
    $in: attempt.questionIds,
  },
});

if (questions.length !== attempt.totalQuestions) {
  return res.status(500).json({
    success: false,
    message:
      "Some questions assigned to this attempt no longer exist",
    data: {},
  });
}

// Create a lookup for submitted answers
const submittedAnswers = new Map();

for (const answer of answers) {
  submittedAnswers.set(
    answer.questionId.toString(),
    answer.selectedOption ?? null
  );
}

// Grade all assigned questions
let correctCount = 0;
const attemptAnswers = [];

for (const question of questions) {
  const questionId = question._id.toString();

  const selectedOption =
    submittedAnswers.get(questionId) ?? null;

  // Find the correct answer from the database
  const correctOption = question.options.find(
    (option) => option.isCorrect === true
  );

  if (!correctOption) {
    return res.status(500).json({
      success: false,
      message:
        "Question does not have a valid correct answer",
      data: {},
    });
  }

  // Validate the selected option
  if (selectedOption !== null) {
    const selectedOptionExists = question.options.some(
      (option) => option.label === selectedOption
    );

    if (!selectedOptionExists) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid option selected for question ${question._id}`,
        data: {},
      });
    }
  }

  const isCorrect =
    selectedOption !== null &&
    selectedOption === correctOption.label;

  if (isCorrect) {
    correctCount += 1;
  }

  attemptAnswers.push({
    attemptId: attempt._id,
    questionId: question._id,
    topicId: question.topicId,
    selectedOption,
    isCorrect,
  });
}

// Calculate score and accuracy
const score = correctCount;

const accuracy =
  attempt.totalQuestions > 0
    ? Math.round(
        (correctCount / attempt.totalQuestions) * 100
      )
    : 0;

// Save answer records
await AttemptAnswer.insertMany(attemptAnswers);

// Update attempt
attempt.correctCount = correctCount;
attempt.score = score;
attempt.accuracy = accuracy;
attempt.status = "completed";

// Ensure submission time is not earlier than start time
const submittedAt = new Date();

attempt.submittedAt =
  submittedAt < attempt.startedAt
    ? attempt.startedAt
    : submittedAt;

await attempt.save();

// Update the student's study streak
const user = await User.findById(req.user._id);
if (user) {
    user.questionsAttempted =
  (user.questionsAttempted || 0) + attempt.totalQuestions;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActiveDate = user.lastActiveDate
    ? new Date(user.lastActiveDate)
    : null;

  if (lastActiveDate) {
    lastActiveDate.setHours(0, 0, 0, 0);
  }

  if (!lastActiveDate) {
    user.studyStreak = 1;
  } else {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const daysSinceLastActive = Math.floor(
      (today.getTime() - lastActiveDate.getTime()) /
        millisecondsPerDay
    );

    if (daysSinceLastActive === 1) {
      user.studyStreak += 1;
    } else if (daysSinceLastActive > 1) {
      user.studyStreak = 1;
    }
  }

  user.lastActiveDate = new Date();

  await user.save();
}

// Create a practice session for practice attempts
let practiceSession = null;

if (attempt.mode === "practice" && questions.length > 0) {
  practiceSession = await PracticeSession.create({
    studentId: req.user._id,
    topicId: questions[0].topicId,
    numberOfQuestions: attempt.totalQuestions,
    score: attempt.score,
    accuracy: attempt.accuracy,
  });
}

// Return result
return res.status(200).json({
  success: true,
  message: "Attempt submitted successfully",
  data: {
    attemptId: attempt._id,
    practiceSessionId: practiceSession?._id ?? null,
    totalQuestions: attempt.totalQuestions,
    correctCount: attempt.correctCount,
    score: attempt.score,
    accuracy: attempt.accuracy,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
  },
});

} catch (error) {
console.error("SUBMIT ATTEMPT ERROR:", error);


return res.status(500).json({
  success: false,
  message: "Failed to submit attempt",
  data: {},
});

}
};

// ======================================================
// GET ONE ATTEMPT WITH ANSWER REVIEW
// ======================================================

export const getAttemptById = async (req, res) => {
try {
const { id } = req.params;


// Validate attempt ID
if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid attempt ID",
    data: {},
  });
}

// Find only the authenticated student's own attempt
const attempt = await Attempt.findOne({
  _id: id,
  userId: req.user._id,
})
  .populate("examId", "name code")
  .populate("subjectId", "name");

if (!attempt) {
  return res.status(404).json({
    success: false,
    message: "Attempt not found",
    data: {},
  });
}

// Do not reveal answers before the attempt is completed
if (attempt.status !== "completed") {
  return res.status(400).json({
    success: false,
    message: "Answer review is only available after submission",
    data: {},
  });
}

// Fetch the saved answers for this attempt
const answers = await AttemptAnswer.find({
  attemptId: attempt._id,
});

// Fetch the questions assigned to this attempt
const questions = await Question.find({
  _id: { $in: attempt.questionIds },
}).populate("topicId", "name");

// Map each assigned question to its saved answer
const answerReview = questions.map((question) => {
  const savedAnswer = answers.find(
    (answer) =>
      answer.questionId.toString() === question._id.toString()
  );

  const correctOption = question.options.find(
    (option) => option.isCorrect === true
  );

  const selectedOption = savedAnswer?.selectedOption ?? null;

  return {
    questionId: question._id,
    questionText: question.questionText,

    options: question.options.map((option) => ({
      label: option.label,
      text: option.text,
    })),

    selectedOption,

    selectedOptionText:
      question.options.find(
        (option) => option.label === selectedOption
      )?.text ?? null,

    correctOption: correctOption?.label ?? null,
    correctOptionText: correctOption?.text ?? null,

    isCorrect: savedAnswer?.isCorrect ?? false,

    explanation: question.explanation,
    topic: question.topicId,
    year: question.year,
  };
});

return res.status(200).json({
  success: true,
  message: "Attempt and answer review fetched successfully",
  data: {
    ...attempt.toObject(),
    answerReview,
  },
});


} catch (error) {
console.error("GET ATTEMPT ERROR:", error);


return res.status(500).json({
  success: false,
  message: "Failed to fetch attempt",
  data: {},
});


}
};
