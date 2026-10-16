import mongoose from "mongoose";

import Question from "../models/question.js";
import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";

// ======================================================
// HELPER: Validate question relationships
// ======================================================

const validateQuestionRelationships = async ({
  examId,
  subjectId,
  topicId,
}) => {
  const exam = await Exam.findById(examId);

  if (!exam) {
    return {
      valid: false,
      status: 404,
      message: "Exam not found",
    };
  }

  const subject = await Subject.findOne({
    _id: subjectId,
    examId,
  });

  if (!subject) {
    return {
      valid: false,
      status: 400,
      message: "Subject does not belong to the selected exam",
    };
  }

  const topic = await Topic.findOne({
    _id: topicId,
    subjectId,
  });

  if (!topic) {
    return {
      valid: false,
      status: 400,
      message: "Topic does not belong to the selected subject",
    };
  }

  return {
    valid: true,
    exam,
    subject,
    topic,
  };
};

// ======================================================
// GET ALL QUESTIONS
// ======================================================



export const getQuestions = async (req, res) => {
  try {
    const { examId, subjectId, topicId, year } = req.query;
    const filter = {};

    if (examId) {
      if (!mongoose.isValidObjectId(examId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examId",
          data: {},
        });
      }
      filter.examId = examId;
    }

    if (subjectId) {
      if (!mongoose.isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId",
          data: {},
        });
      }
      filter.subjectId = subjectId;
    }

    if (topicId) {
      if (!mongoose.isValidObjectId(topicId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid topicId",
          data: {},
        });
      }
      filter.topicId = topicId;
    }

    if (year !== undefined) {
      const numericYear = Number(year);

      if (!Number.isInteger(numericYear) || numericYear < 1) {
        return res.status(400).json({
          success: false,
          message: "Year must be a valid positive integer",
          data: {},
        });
      }

      filter.year = numericYear;
    }

    // Students can only access published questions.
    if (req.user.role === "student") {
      filter.status = "published";
    }

    const questions = await Question.find(filter)
      .select("-options.isCorrect")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully",
      data: questions,
    });
  } catch (error) {
    console.error("GET QUESTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      data: {},
    });
  }
};



// ======================================================
// GET ONE QUESTION BY ID
// ======================================================


export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {},
      });
    }

    // Restrict students to published questions only.
    const filter = { _id: id };

    if (req.user.role === "student") {
      filter.status = "published";
    }

    const question = await Question.findOne(filter)
      .select("-options.isCorrect")
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question fetched successfully",
      data: question,
    });
  } catch (error) {
    console.error("GET QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch question",
      data: {},
    });
  }
};


// ======================================================
// CREATE QUESTION
// ======================================================


export const createQuestion = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      topicId,
      year,
      questionType = "multiple-choice",
      questionText,
      options,
      explanation,
    } = req.body;

    // Validate required fields
    if (
      !examId ||
      !subjectId ||
      !topicId ||
      year === undefined ||
      !questionText ||
      !options
    ) {
      return res.status(400).json({
        success: false,
        message:
          "examId, subjectId, topicId, year, questionText, and options are required",
        data: {},
      });
    }

    // Validate MongoDB IDs
    if (
      !mongoose.isValidObjectId(examId) ||
      !mongoose.isValidObjectId(subjectId) ||
      !mongoose.isValidObjectId(topicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId, subjectId, or topicId",
        data: {},
      });
    }

    // Validate question type
    if (questionType !== "multiple-choice") {
      return res.status(400).json({
        success: false,
        message: "Unsupported question type",
        data: {},
      });
    }

    // Validate question text
    if (typeof questionText !== "string" || !questionText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question text cannot be empty",
        data: {},
      });
    }

    // Validate year
    const numericYear = Number(year);

    if (!Number.isInteger(numericYear) || numericYear < 1) {
      return res.status(400).json({
        success: false,
        message: "Year must be a valid positive integer",
        data: {},
      });
    }

    // Validate options
    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
      return res.status(400).json({
        success: false,
        message: "A question must have between 2 and 4 options",
        data: {},
      });
    }

    if (
      options.some(
        (option) =>
          !option ||
          typeof option.label !== "string" ||
          !option.label.trim() ||
          typeof option.text !== "string" ||
          !option.text.trim() ||
          typeof option.isCorrect !== "boolean"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Every option must have a label, text, and boolean isCorrect value",
        data: {},
      });
    }

    const correctAnswers = options.filter((option) => option.isCorrect);

    if (correctAnswers.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "A question must have exactly one correct answer",
        data: {},
      });
    }

    // Validate Exam -> Subject -> Topic relationship
    const relationship = await validateQuestionRelationships({
      examId,
      subjectId,
      topicId,
    });

    if (!relationship.valid) {
      return res.status(relationship.status).json({
        success: false,
        message: relationship.message,
        data: {},
      });
    }

    // Create question using the authenticated user
    const question = await Question.create({
      examId,
      subjectId,
      topicId,
      createdBy: req.user._id,
      year: numericYear,
      questionType,
      questionText: questionText.trim(),
      options,
      explanation,
    });

    // Hide correct answers in the response
    const safeQuestion = question.toObject();

    safeQuestion.options = safeQuestion.options.map((option) => {
      const { isCorrect, ...safeOption } = option;
      return safeOption;
    });

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: safeQuestion,
    });
  } catch (error) {
    console.error("CREATE QUESTION ERROR:", error);

    // Return useful validation errors
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: {},
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create question",
      data: {},
    });
  }
};


// ======================================================
// UPDATE QUESTION
// ======================================================

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {},
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {},
      });
    }

    // Teacher can only update their own question.
    // Admin can update any question.
    const isOwner =
      question.createdBy.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this question",
        data: {},
      });
    }

    const {
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation,
    } = req.body;

    // Use existing relationships if they were not supplied
    const newExamId = examId || question.examId;
    const newSubjectId = subjectId || question.subjectId;
    const newTopicId = topicId || question.topicId;

    if (
      !mongoose.isValidObjectId(newExamId) ||
      !mongoose.isValidObjectId(newSubjectId) ||
      !mongoose.isValidObjectId(newTopicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId, subjectId, or topicId",
        data: {},
      });
    }

    // Validate Exam -> Subject -> Topic relationship
    const relationship = await validateQuestionRelationships({
      examId: newExamId,
      subjectId: newSubjectId,
      topicId: newTopicId,
    });

    if (!relationship.valid) {
      return res.status(relationship.status).json({
        success: false,
        message: relationship.message,
        data: {},
      });
    }

    question.examId = newExamId;
    question.subjectId = newSubjectId;
    question.topicId = newTopicId;

    if (year !== undefined) {
      question.year = year;
    }

    if (questionText !== undefined) {
      question.questionText = questionText;
    }

    if (options !== undefined) {
      question.options = options;
    }

    if (explanation !== undefined) {
      question.explanation = explanation;
    }

    // Do NOT allow createdBy to be changed
    await question.save();

    // Hide correct answers
    const safeQuestion = question.toObject();

    safeQuestion.options = safeQuestion.options.map((option) => {
      const { isCorrect, ...safeOption } = option;
      return safeOption;
    });

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: safeQuestion,
    });
  } catch (error) {
    console.error("UPDATE QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      data: {},
    });
  }
};

// ======================================================
// DELETE QUESTION
// ======================================================

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {},
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {},
      });
    }

    // Teacher can only delete their own question.
    // Admin can delete any question.
    const isOwner =
      question.createdBy.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this question",
        data: {},
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("DELETE QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      data: {},
    });
  }
};