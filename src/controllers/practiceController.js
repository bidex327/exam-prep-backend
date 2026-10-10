
import mongoose from "mongoose";
import Question from "../models/question.js";
import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import PracticeSession from "../models/PracticeSession.js";
import User from "../models/User.js";

// ======================================================
// HELPER: VALIDATE OPTIONAL OBJECTID FILTERS
// ======================================================

const validateObjectIdFilter = (value, fieldName, filter) => {
  if (value === undefined) {
    return null;
  }

  if (
    typeof value !== "string" ||
    !mongoose.Types.ObjectId.isValid(value)
  ) {
    return {
      success: false,
      message: `Invalid ${fieldName}`,
      data: {},
    };
  }

  filter[fieldName] = new mongoose.Types.ObjectId(value);

  return null;
};

// ======================================================
// GET PRACTICE QUESTIONS
// ======================================================

const getPracticeQuestions = async (req, res) => {
  try {
    const { examId, subjectId, topicId, year } = req.query;

    const filter = {};

    // Validate each optional ID filter.
    const idFilters = [
      ["examId", examId],
      ["subjectId", subjectId],
      ["topicId", topicId],
    ];

    for (const [fieldName, value] of idFilters) {
      if (value === undefined) {
        continue;
      }

      const validationError = validateObjectIdFilter(
        value,
        fieldName,
        filter
      );

      if (validationError) {
        return res.status(400).json(validationError);
      }
    }

    // Validate year when supplied.
    if (year !== undefined) {
      const currentYear = new Date().getFullYear();

      if (
        typeof year !== "string" ||
        year.trim() === "" ||
        !/^\d{4}$/.test(year) ||
        Number(year) < 1900 ||
        Number(year) > currentYear
      ) {
        return res.status(400).json({
          success: false,
          message: "Year must be a valid number",
          data: {},
        });
      }

      filter.year = Number(year);
    }

    const questions = await Question.find(filter).lean();

    // Never reveal correct answers or explanations during practice.
    const practiceQuestions = questions.map((question) => {
      const { explanation, ...safeQuestion } = question;

      safeQuestion.options = safeQuestion.options.map((option) => {
        const { isCorrect, ...safeOption } = option;
        return safeOption;
      });

      return safeQuestion;
    });

    return res.status(200).json({
      success: true,
      message: "Practice questions fetched successfully",
      data: practiceQuestions,
    });
  } catch (error) {
    console.error("Get practice questions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch practice questions",
      data: {},
    });
  }
};

// ======================================================
// GET AVAILABLE YEARS
// ======================================================

const getAvailableYears = async (req, res) => {
  try {
    const { examId, subjectId, topicId } = req.query;

    const filter = {};

    const idFilters = [
      ["examId", examId],
      ["subjectId", subjectId],
      ["topicId", topicId],
    ];

    for (const [fieldName, value] of idFilters) {
      if (value === undefined) {
        continue;
      }

      const validationError = validateObjectIdFilter(
        value,
        fieldName,
        filter
      );

      if (validationError) {
        return res.status(400).json(validationError);
      }
    }

    const years = await Question.distinct("year", filter);

    const availableYears = years
      .filter((year) => year !== null && year !== undefined)
      .sort((a, b) => Number(b) - Number(a));

    return res.status(200).json({
      success: true,
      message: "Available years fetched successfully",
      data: availableYears,
    });
  } catch (error) {
    console.error("Get available years error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available years",
      data: {},
    });
  }
};

// ======================================================
// SUBMIT PRACTICE
// ======================================================

const submitPractice = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Answers must be a non-empty array",
        data: {},
      });
    }

    const questionIds = answers.map((answer) => answer?.questionId);

    const invalidQuestionId = questionIds.some(
      (questionId) =>
        typeof questionId !== "string" ||
        !mongoose.Types.ObjectId.isValid(questionId)
    );

    if (invalidQuestionId) {
      return res.status(400).json({
        success: false,
        message: "One or more question IDs are invalid",
        data: {},
      });
    }

    // Prevent duplicate question IDs in one submission.
    const normalizedQuestionIds = questionIds.map((id) => id.toLowerCase());

    if (
      new Set(normalizedQuestionIds).size !==
      normalizedQuestionIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Duplicate question IDs are not allowed",
        data: {},
      });
    }

    // Validate selected options before accessing the database.
    const invalidSelectedOption = answers.some(
      (answer) =>
        answer.selectedOption !== undefined &&
        answer.selectedOption !== null &&
        typeof answer.selectedOption !== "string"
    );

    if (invalidSelectedOption) {
      return res.status(400).json({
        success: false,
        message: "Selected options must be strings",
        data: {},
      });
    }

    const questions = await Question.find({
      _id: { $in: questionIds },
    });

    if (questions.length !== answers.length) {
      return res.status(400).json({
        success: false,
        message: "One or more question IDs are invalid",
        data: {},
      });
    }

    const firstQuestion = questions[0];

    const sameSession = questions.every((question) => {
      return (
        question.examId.toString() === firstQuestion.examId.toString() &&
        question.subjectId.toString() ===
          firstQuestion.subjectId.toString() &&
        question.topicId.toString() === firstQuestion.topicId.toString()
      );
    });

    if (!sameSession) {
      return res.status(400).json({
        success: false,
        message:
          "All questions in a practice submission must belong to the same exam, subject and topic",
        data: {},
      });
    }

    // Calculate scores using correct answers stored in the database.
    let correctCount = 0;
    const answerResults = [];

    for (const submittedAnswer of answers) {
      const question = questions.find(
        (item) =>
          item._id.toString() === submittedAnswer.questionId
      );

      const correctOption = question.options.find(
        (option) => option.isCorrect === true
      );

      const selectedOption = submittedAnswer.selectedOption;

      // Match the submitted option against the stored option label.
      const isCorrect = Boolean(
        correctOption &&
          selectedOption === correctOption.label
      );

      if (isCorrect) {
        correctCount++;
      }

      answerResults.push({
        questionId: question._id,
        topicId: question.topicId,
        selectedOption: selectedOption || null,
        isCorrect,
      });
    }

    const totalQuestions = answers.length;

    const accuracy = Math.round(
      (correctCount / totalQuestions) * 100
    );

    // Create the completed attempt.
    const attempt = await Attempt.create({
      userId: studentId,
      examId: firstQuestion.examId,
      subjectId: firstQuestion.subjectId,
      questionIds: questions.map((question) => question._id),
      mode: "practice",
      status: "completed",
      totalQuestions,
      correctCount,
      score: correctCount,
      accuracy,
      submittedAt: new Date(),
    });

    // Save the answers for this attempt.
    const attemptAnswers = answerResults.map((answer) => ({
      attemptId: attempt._id,
      questionId: answer.questionId,
      topicId: answer.topicId,
      selectedOption: answer.selectedOption,
      isCorrect: answer.isCorrect,
    }));

    await AttemptAnswer.insertMany(attemptAnswers);

    // Create the practice session.
    const practiceSession = await PracticeSession.create({
      studentId,
      topicId: firstQuestion.topicId,
      numberOfQuestions: totalQuestions,
      score: correctCount,
      accuracy,
    });

    // Update the student's study streak and question count.
    const user = await User.findById(studentId);

    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (user.lastActiveDate) {
        const lastActive = new Date(user.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);

        if (lastActive.getTime() === today.getTime()) {
          // Already practised today; keep the current streak.
        } else if (lastActive.getTime() === yesterday.getTime()) {
          user.studyStreak += 1;
        } else {
          user.studyStreak = 1;
        }
      } else {
        user.studyStreak = 1;
      }

      user.lastActiveDate = new Date();
      user.questionsAttempted += totalQuestions;

      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: "Practice submitted successfully",
      data: {
        attemptId: attempt._id,
        practiceSessionId: practiceSession._id,
        totalQuestions,
        correctCount,
        accuracy,
      },
    });
  } catch (error) {
    console.error("Submit practice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit practice",
      data: {},
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

export {
  getPracticeQuestions,
  getAvailableYears,
  submitPractice,
};
