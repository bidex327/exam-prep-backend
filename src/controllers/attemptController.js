import mongoose from "mongoose";

import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import Question from "../models/question.js";
import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import PracticeSession from "../models/PracticeSession.js";
import User from "../models/User.js";

import { updateStudyStreak } from "../utils/updateStreak.js";

// ============================================
// START ATTEMPT
// POST /api/attempts
// ============================================

export const startAttempt = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      topicId,
      numberOfQuestions,
      durationMinutes,
      mode = "practice",
      year,
      years,
    } = req.body;

    // Validate required fields.
    if (!examId || !subjectId || !numberOfQuestions) {
      return res.status(400).json({
        success: false,
        message:
          "examId, subjectId, and numberOfQuestions are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(examId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId or subjectId.",
      });
    }

    if (
      !Number.isInteger(Number(numberOfQuestions)) ||
      Number(numberOfQuestions) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "numberOfQuestions must be a positive integer.",
      });
    }

    if (!["practice", "timed-cbt"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mode. Use practice or timed-cbt.",
      });
    }

    if (
      durationMinutes !== undefined &&
      durationMinutes !== null &&
      (
        !Number.isFinite(Number(durationMinutes)) ||
        Number(durationMinutes) < 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "durationMinutes must be at least 1.",
      });
    }

    if (
      mode === "timed-cbt" &&
      (
        durationMinutes === undefined ||
        durationMinutes === null ||
        !Number.isFinite(Number(durationMinutes)) ||
        Number(durationMinutes) < 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "durationMinutes is required for timed-cbt mode.",
      });
    }

    if (
      topicId &&
      !mongoose.Types.ObjectId.isValid(topicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid topicId.",
      });
    }

    // Confirm that the exam exists.
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Confirm that the subject exists and belongs to the exam.
    // Confirm that the subject exists and belongs to the exam.

const subject = await Subject.findById(subjectId);

if (!subject) {
  return res.status(404).json({
    success: false,
    message: "Subject not found.",
  });
}


if (subject.examId.toString() !== String(examId)) {
  return res.status(400).json({
    success: false,
    message: "The selected subject does not belong to this exam.",
  });
}


    // Validate the selected topic when supplied.
    if (topicId) {
      const topic = await Topic.findById(topicId);

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Topic not found.",
        });
      }

      if (
        topic.subjectId &&
        topic.subjectId.toString() !== String(subjectId)
      ) {
        return res.status(400).json({
          success: false,
          message: "The selected topic does not belong to this subject.",
        });
      }
    }

    // Build the question filter.
    const questionFilter = {
      examId: new mongoose.Types.ObjectId(examId),
      subjectId: new mongoose.Types.ObjectId(subjectId),
    };

    if (topicId) {
      questionFilter.topicId =
        new mongoose.Types.ObjectId(topicId);
    }

    // Support filtering by one year or several years.
    let selectedYears = [];

    if (Array.isArray(years)) {
      selectedYears = years;
    } else if (year !== undefined && year !== null) {
      selectedYears = [year];
    }

    if (selectedYears.length > 0) {
      const parsedYears = selectedYears.map(Number);

      if (
        parsedYears.some(
          (selectedYear) => !Number.isInteger(selectedYear)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "years must contain valid years.",
        });
      }

      questionFilter.year = {
        $in: parsedYears,
      };
    }

    // Select random questions.
    // Correct answers are deliberately excluded from the response.
    const questions = await Question.aggregate([
      {
        $match: questionFilter,
      },
      {
        $sample: {
          size: Number(numberOfQuestions),
        },
      },
      {
        $project: {
          questionText: 1,
          options: {
            $map: {
              input: "$options",
              as: "option",
              in: {
                label: "$$option.label",
                text: "$$option.text",
              },
            },
          },
          examId: 1,
          subjectId: 1,
          topicId: 1,
          year: 1,
        },
      },
    ]);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions were found for the selected criteria.",
      });
    }

    if (questions.length < Number(numberOfQuestions)) {
      return res.status(400).json({
        success: false,
        message: `Only ${questions.length} questions are available for the selected criteria.`,
      });
    }

    // Create the attempt.
    const attempt = await Attempt.create({
      userId: req.user._id,
      examId,
      subjectId,
      questionIds: questions.map((question) => question._id),
      mode,
      status: "in-progress",
      totalQuestions: questions.length,
      correctCount: 0,
      score: null,
      accuracy: null,
      durationMinutes:
        durationMinutes === undefined || durationMinutes === null
          ? null
          : Number(durationMinutes),
    });

    return res.status(201).json({
      success: true,
      message: "Attempt started successfully.",
      data: {
        attemptId: attempt._id,
        examId: attempt.examId,
        subjectId: attempt.subjectId,
        mode: attempt.mode,
        totalQuestions: attempt.totalQuestions,
        durationMinutes: attempt.durationMinutes,
        startedAt: attempt.startedAt,
        questions,
      },
    });
  } catch (error) {
    console.error("Start attempt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start attempt.",
    });
  }
};




export const submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "answers must be an array.",
      });
    }

    // Only allow the owner of the attempt to submit it.
    const attempt = await Attempt.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    if (attempt.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "This attempt has already been submitted.",
      });
    }

    // Check whether the attempt has expired.
    const now = new Date();

    const deadline =
      attempt.durationMinutes !== null &&
      attempt.durationMinutes !== undefined
        ? new Date(
            attempt.startedAt.getTime() +
              attempt.durationMinutes * 60 * 1000
          )
        : null;

    const isExpired = deadline !== null && now >= deadline;

    if (answers.length === 0 && !isExpired) {
      return res.status(400).json({
        success: false,
        message: "Please submit at least one answer.",
      });
    }

    // Validate each submitted answer.
    const submittedQuestionIds = [];

    for (const answer of answers) {
      if (
        !answer.questionId ||
        !mongoose.Types.ObjectId.isValid(answer.questionId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Every answer must contain a valid questionId.",
        });
      }

      if (
        answer.selectedOption !== undefined &&
        answer.selectedOption !== null &&
        typeof answer.selectedOption !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "selectedOption must be a string or null.",
        });
      }

      if (
        answer.selectedOption !== undefined &&
        answer.selectedOption !== null &&
        answer.selectedOption.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "selectedOption cannot be an empty string.",
        });
      }

      const questionId = answer.questionId.toString();

      if (submittedQuestionIds.includes(questionId)) {
        return res.status(400).json({
          success: false,
          message: "A question cannot be answered more than once.",
        });
      }

      submittedQuestionIds.push(questionId);
    }

    // Every submitted question must belong to this attempt.
    const assignedQuestionIds = attempt.questionIds.map(
      (questionId) => questionId.toString()
    );

    const invalidQuestion = submittedQuestionIds.some(
      (questionId) => !assignedQuestionIds.includes(questionId)
    );

    if (invalidQuestion) {
      return res.status(400).json({
        success: false,
        message: "One or more questions do not belong to this attempt.",
      });
    }

    // Retrieve every question assigned to the attempt.
    const questions = await Question.find({
      _id: {
        $in: attempt.questionIds,
      },
    });

    if (questions.length !== attempt.questionIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more assigned questions could not be found.",
      });
    }

    // AttemptAnswer requires a topicId for every answer record.
    // Validate this before writing any answer records.
    const questionWithoutTopic = questions.find(
      (question) => !question.topicId
    );

    if (questionWithoutTopic) {
      return res.status(400).json({
        success: false,
        message:
          "One or more assigned questions have no topic. Each question must have a topic before this attempt can be submitted.",
      });
    }

    // Confirm that submitted option labels exist on their questions.
    for (const answer of answers) {
      if (
        answer.selectedOption === undefined ||
        answer.selectedOption === null
      ) {
        continue;
      }

      const question = questions.find(
        (item) =>
          item._id.toString() === answer.questionId.toString()
      );

      const optionExists = question.options.some(
        (option) => option.label === answer.selectedOption
      );

      if (!optionExists) {
        return res.status(400).json({
          success: false,
          message: `Invalid option for question ${answer.questionId}.`,
        });
      }
    }

    // Calculate the score for every assigned question.
    // Unanswered questions are counted as incorrect.
    let correctCount = 0;

    const answerRecords = questions.map((question) => {
      const submittedAnswer = answers.find(
        (answer) =>
          answer.questionId.toString() === question._id.toString()
      );

      const selectedOption =
        submittedAnswer?.selectedOption ?? null;

      const correctOption = question.options.find(
        (option) => option.isCorrect === true
      );

      const isCorrect =
        selectedOption !== null &&
        correctOption !== undefined &&
        correctOption.label === selectedOption;

      if (isCorrect) {
        correctCount += 1;
      }

      return {
        attemptId: attempt._id,
        questionId: question._id,
        topicId: question.topicId,
        selectedOption,
        isCorrect,
      };
    });

    const totalQuestions = attempt.questionIds.length;
    const score = correctCount;

    const accuracy =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    const finalSubmittedAt = new Date();

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (finalSubmittedAt.getTime() - attempt.startedAt.getTime()) /
          1000
      )
    );


    attempt.correctCount = correctCount;
    attempt.score = score;
    attempt.accuracy = accuracy;
    attempt.durationSeconds = durationSeconds;
    attempt.submittedAt = finalSubmittedAt;
    attempt.status = isExpired ? "auto-submitted" : "completed";

    await attempt.save();


    await AttemptAnswer.deleteMany({
      attemptId: attempt._id,
    });

    await AttemptAnswer.insertMany(answerRecords);


    const user = await User.findById(req.user._id);

    if (user) {
      user.questionsAttempted =
        (user.questionsAttempted || 0) + totalQuestions;

      await user.save();

      await updateStudyStreak(req.user._id);
    }

    // Create a PracticeSession only for practice mode.
    let practiceSession = null;

    if (attempt.mode === "practice") {
      const topicIds = [
        ...new Set(
          questions.map((question) => question.topicId.toString())
        ),
      ];

      const topicStats = new Map();

for (const question of questions) {
  const topicId = question.topicId.toString();

  if (!topicStats.has(topicId)) {
    topicStats.set(topicId, {
      topicId: question.topicId,
      numberOfQuestions: 0,
      correctCount: 0,
    });
  }

  const stats = topicStats.get(topicId);
  stats.numberOfQuestions++;

  const submittedAnswer = answers.find(
    (answer) =>
      answer.questionId.toString() === question._id.toString()
  );

  const selectedOption = submittedAnswer?.selectedOption ?? null;

  const correctOption = question.options.find(
    (option) => option.isCorrect === true
  );

  if (
    selectedOption !== null &&
    correctOption &&
    correctOption.label === selectedOption
  ) {
    stats.correctCount++;
  }
}

const topicBreakdown = Array.from(topicStats.values());

      practiceSession = await PracticeSession.create({
        user: req.user._id,
        subjectId: attempt.subjectId,
        topicId: questions[0]?.topicId ?? null,
        topicIds,
        topicBreakdown,
        mode: attempt.mode,
        numberOfQuestions: totalQuestions,
        correctAnswer: correctCount,
        score,
        accuracy,
        durationSeconds,
        startedAt: attempt.startedAt,
        completedAt: finalSubmittedAt,
        status: "completed",
      });
    }

    return res.status(200).json({
      success: true,
      message: isExpired
        ? "Attempt automatically submitted because the time expired."
        : "Attempt submitted successfully.",
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        totalQuestions,
        correctCount,
        score,
        accuracy,
        durationSeconds,
        submittedAt: attempt.submittedAt,
        practiceSessionId: practiceSession?._id ?? null,
      },
    });
  } catch (error) {
    console.error("Submit attempt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit attempt.",
    });
  }
};


// ============================================
// GET ATTEMPT BY ID
// GET /api/attempts/:id
// ============================================

export const getAttemptById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    // A user can only retrieve their own attempt.
    const attempt = await Attempt.findOne({
      _id: id,
      userId: req.user._id,
    })
      .populate("examId")
      .populate("subjectId");

    const isInProgress = attempt.status === "in-progress";

if (
  !isInProgress &&
  !["completed", "auto-submitted", "submitted"].includes(
    attempt.status
  )
) {
  return res.status(400).json({
    success: false,
    message: "This attempt has an unsupported status.",
  });
}

    const savedAnswers = await AttemptAnswer.find({
      attemptId: attempt._id,
    });
    if (isInProgress) {
  const savedAnswers = await AttemptAnswer.find({
    attemptId: attempt._id,
  }).select("questionId selectedOption");

  const questions = await Question.find({
    _id: { $in: attempt.questionIds },
  }).select("questionText options.label options.text topicId year");

  const resumableQuestions = attempt.questionIds.map((questionId) => {
    const question = questions.find(
      (item) => item._id.toString() === questionId.toString()
    );

    const savedAnswer = savedAnswers.find(
      (answer) =>
        answer.questionId.toString() === questionId.toString()
    );

    if (!question) {
      return {
        questionId,
        questionText: null,
        options: [],
        selectedOption: savedAnswer?.selectedOption ?? null,
        topicId: null,
        year: null,
      };
    }

    return {
      questionId: question._id,
      questionText: question.questionText,
      options: question.options.map((option) => ({
        label: option.label,
        text: option.text,
      })),
      selectedOption: savedAnswer?.selectedOption ?? null,
      topicId: question.topicId ?? null,
      year: question.year ?? null,
    };
  });

  const deadline =
    attempt.durationMinutes != null && attempt.startedAt
      ? new Date(
          attempt.startedAt.getTime() +
            attempt.durationMinutes * 60 * 1000
        )
      : null;

  return res.status(200).json({
    success: true,
    message: "In-progress attempt retrieved successfully.",
    data: {
      attemptId: attempt._id,
      exam: attempt.examId,
      subject: attempt.subjectId,
      mode: attempt.mode,
      status: attempt.status,
      totalQuestions: attempt.totalQuestions,
      durationMinutes: attempt.durationMinutes,
      durationSeconds: attempt.durationSeconds,
      startedAt: attempt.startedAt,
      deadline,
      isExpired: deadline !== null && new Date() >= deadline,
      questions: resumableQuestions,
    },
  });
}

    const questions = await Question.find({
      _id: {
        $in: attempt.questionIds,
      },
    });

    const answerReview = attempt.questionIds.map((questionId) => {
      const question = questions.find(
        (item) => item._id.toString() === questionId.toString()
      );

      const savedAnswer = savedAnswers.find(
        (answer) =>
          answer.questionId.toString() === questionId.toString()
      );

      if (!question) {
        return {
          questionId,
          questionText: null,
          options: [],
          selectedOption: savedAnswer?.selectedOption ?? null,
          isCorrect: savedAnswer?.isCorrect ?? false,
          correctOption: null,
          explanation: null,
          topicId: savedAnswer?.topicId ?? null,
          year: null,
        };
      }

      const correctOption = question.options.find(
        (option) => option.isCorrect === true
      );

      return {
        questionId: question._id,
        questionText: question.questionText,
        options: question.options.map((option) => ({
          label: option.label,
          text: option.text,
        })),
        selectedOption: savedAnswer?.selectedOption ?? null,
        isCorrect: savedAnswer?.isCorrect ?? false,
        correctOption: correctOption
          ? {
              label: correctOption.label,
              text: correctOption.text,
            }
          : null,
        explanation: question.explanation ?? null,
        topicId: question.topicId ?? null,
        year: question.year ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Attempt retrieved successfully.",
      data: {
        attemptId: attempt._id,
        exam: attempt.examId,
        subject: attempt.subjectId,
        mode: attempt.mode,
        status: attempt.status,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        score: attempt.score,
        accuracy: attempt.accuracy,
        durationMinutes: attempt.durationMinutes,
        durationSeconds: attempt.durationSeconds,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        answers: answerReview,
      },
    });
  } catch (error) {
    console.error("Get attempt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve attempt.",
    });
  }
};


export const saveAttemptAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOption } = req.body;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID or question ID.",
      });
    }

    if (
      selectedOption !== null &&
      selectedOption !== undefined &&
      (typeof selectedOption !== "string" || !selectedOption.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "selectedOption must be a non-empty string or null.",
      });
    }

    const attempt = await Attempt.findOne({
      _id: id,
      userId: req.user._id,
      status: "in-progress",
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "In-progress attempt not found.",
      });
    }

    if (
      attempt.durationMinutes &&
      Date.now() >=
        attempt.startedAt.getTime() +
          attempt.durationMinutes * 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Time has expired. Submit the attempt to finalize it.",
      });
    }

    const assigned = attempt.questionIds.some(
      (item) => item.toString() === questionId
    );

    if (!assigned) {
      return res.status(400).json({
        success: false,
        message: "This question does not belong to the attempt.",
      });
    }

    const question = await Question.findById(questionId).select(
      "options topicId"
    );

    if (!question || !question.topicId) {
      return res.status(400).json({
        success: false,
        message: "Question or its topic could not be found.",
      });
    }

    const normalizedOption = selectedOption ?? null;

    if (
      normalizedOption !== null &&
      !question.options.some((option) => option.label === normalizedOption)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid option for this question.",
      });
    }

    const savedAnswer = await AttemptAnswer.findOneAndUpdate(
      {
        attemptId: attempt._id,
        questionId,
      },
      {
        $set: { selectedOption: normalizedOption },
        $setOnInsert: {
          topicId: question.topicId,
          isCorrect: false,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully.",
      data: {
        questionId: savedAnswer.questionId,
        selectedOption: savedAnswer.selectedOption,
      },
    });
  } catch (error) {
    console.error("Save attempt answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save answer.",
    });
  }
};