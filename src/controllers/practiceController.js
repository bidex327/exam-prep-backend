import mongoose from "mongoose";
import Question from "../models/question.js";
import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import PracticeSession from "../models/PracticeSession.js";
import User from "../models/User.js";
import { updateStudyStreak } from "../utils/updateStreak.js";

// Validate optional MongoDB ObjectId filters.
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

// GET /api/practice
const getPracticeQuestions = async (req, res) => {
  try {
    const { examId, subjectId, topicId, year } = req.query;
    const filter = {};

    for (const [fieldName, value] of [
      ["examId", examId],
      ["subjectId", subjectId],
      ["topicId", topicId],
    ]) {
      if (value === undefined) continue;

      const validationError = validateObjectIdFilter(
        value,
        fieldName,
        filter
      );

      if (validationError) {
        return res.status(400).json(validationError);
      }
    }

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

    // Never expose correct answers or explanations during practice.
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

// GET /api/practice/years
const getAvailableYears = async (req, res) => {
  try {
    const { examId, subjectId, topicId } = req.query;
    const filter = {};

    for (const [fieldName, value] of [
      ["examId", examId],
      ["subjectId", subjectId],
      ["topicId", topicId],
    ]) {
      if (value === undefined) continue;

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

// POST /api/practice/submit
const submitPractice = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { answers, startedAt } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Answers must be a non-empty array",
        data: {},
      });
    }

    // Calculate the actual elapsed practice duration.
    // The frontend should send startedAt when the session begins.
    const submittedAt = new Date();
    let durationSeconds = 0;

    if (startedAt !== undefined) {
      if (typeof startedAt !== "string") {
        return res.status(400).json({
          success: false,
          message: "startedAt must be a valid date string",
          data: {},
        });
      }

      const startTime = new Date(startedAt);

      if (
        Number.isNaN(startTime.getTime()) ||
        startTime > submittedAt
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid practice session start time",
          data: {},
        });
      }

      durationSeconds = Math.floor(
        (submittedAt.getTime() - startTime.getTime()) / 1000
      );
    }

    // Validate question IDs.
    const questionIds = answers.map(
      (answer) => answer?.questionId
    );

    if (
      questionIds.some(
        (id) =>
          typeof id !== "string" ||
          !mongoose.Types.ObjectId.isValid(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more question IDs are invalid",
        data: {},
      });
    }

    const normalizedIds = questionIds.map((id) =>
      id.toLowerCase()
    );

    if (new Set(normalizedIds).size !== normalizedIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate question IDs are not allowed",
        data: {},
      });
    }

    // Validate selected options.
    if (
      answers.some(
        (answer) =>
          answer.selectedOption !== undefined &&
          answer.selectedOption !== null &&
          typeof answer.selectedOption !== "string"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected options must be strings",
        data: {},
      });
    }

    // Retrieve the submitted questions.
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

    // All questions must belong to the same exam and subject.
    const sameSession = questions.every(
      (question) =>
        question.examId.toString() ===
          firstQuestion.examId.toString() &&
        question.subjectId.toString() ===
          firstQuestion.subjectId.toString()
    );
 if (!sameSession) {
      return res.status(400).json({
        success: false,
        message:
          "All questions must belong to the same exam and subject",
        data: {},
      });
    }

    // Reject selected option labels that do not exist for their question.
    for (const submittedAnswer of answers) {
      const question = questions.find(
        (item) =>
          item._id.toString() === submittedAnswer.questionId
      );

      const selectedOption = submittedAnswer.selectedOption;

      // Allow unanswered questions.
      if (selectedOption === undefined || selectedOption === null) {
        continue;
      }

      const optionExists = question.options.some(
        (option) => option.label === selectedOption
      );

      if (!optionExists) {
        return res.status(400).json({
          success: false,
          message: `Invalid selected option for question ${submittedAnswer.questionId}`,
          data: {},
        });
      }
    }

    // Mark submitted answers and calculate the score.
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

    // Save the completed attempt.
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
      submittedAt,
    });

    // Save each submitted answer.
    await AttemptAnswer.insertMany(
      answerResults.map((answer) => ({
        attemptId: attempt._id,
        questionId: answer.questionId,
        topicId: answer.topicId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
      }))
    );

    // Aggregate results for each topic.
    const topicStats = new Map();

    for (const answer of answerResults) {
      if (!answer.topicId) {
        throw new Error(
          `Question ${answer.questionId} has no topicId`
        );
      }

      const topicId = answer.topicId.toString();

      if (!topicStats.has(topicId)) {
        topicStats.set(topicId, {
          topicId: answer.topicId,
          numberOfQuestions: 0,
          correctCount: 0,
        });
      }

      const stats = topicStats.get(topicId);

      stats.numberOfQuestions++;

      if (answer.isCorrect) {
        stats.correctCount++;
      }
    }

    const topicBreakdown = Array.from(
      topicStats.values()
    );

    const topicIds = topicBreakdown.map(
      (topic) => topic.topicId
    );

    // Save the completed practice session.
    // The schema uses "user" as its owner field.
    const practiceSession = await PracticeSession.create({
      user: studentId,
      subjectId: firstQuestion.subjectId,
      topicId:
        topicIds.length === 1 ? topicIds[0] : null,
      topicIds,
      topicBreakdown,
      mode: "practice",
      numberOfQuestions: totalQuestions,
      correctAnswer: correctCount,
      score: correctCount,
      accuracy,
      durationSeconds,
      status: "completed",
      startedAt: startedAt
        ? new Date(startedAt)
        : submittedAt,
      completedAt: submittedAt,
    });

    // Update the student's question count and study streak once.
    const user = await User.findById(studentId);

    if (user) {
      user.questionsAttempted =
        (user.questionsAttempted || 0) + totalQuestions;

      updateStudyStreak(user);
      await user.save();
    }

    // Return the completed practice results.
    return res.status(201).json({
      success: true,
      message: "Practice submitted successfully",
      data: {
        attemptId: attempt._id,
        practiceSessionId: practiceSession._id,
        totalQuestions,
        correctCount,
        accuracy,
        durationSeconds,
      },
    });
  } catch (error) {
    console.error("Submit practice error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to submit practice",
      data: {},
    });
  }
};

// Export all controllers used by practiceRoutes.js.
export {
  getPracticeQuestions,
  getAvailableYears,
  submitPractice,
};