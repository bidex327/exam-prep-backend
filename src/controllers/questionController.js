import mongoose from "mongoose";

import Question from "../models/question.js";
import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";

// ======================================================
// GET ALL QUESTIONS
// ======================================================
// Supports optional filters:
// examId
// subjectId
// topicId
// year
//
// Example:
// GET /api/questions?examId=...
//
// Multiple filters can also be combined.
// ======================================================

export const getQuestions = async (req, res) => {
  try {
    const { examId, subjectId, topicId, year } = req.query;

    // Start with an empty filter.
    const filter = {};

    // --------------------------------------------------
    // FILTER BY EXAM
    // --------------------------------------------------

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

    // --------------------------------------------------
    // FILTER BY SUBJECT
    // --------------------------------------------------

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

    // --------------------------------------------------
    // FILTER BY TOPIC
    // --------------------------------------------------

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

    // --------------------------------------------------
    // FILTER BY YEAR
    // --------------------------------------------------

    if (year) {
      const numericYear = Number(year);

      if (!Number.isInteger(numericYear)) {
        return res.status(400).json({
          success: false,
          message: "Year must be a valid number",
          data: {},
        });
      }

      filter.year = numericYear;
    }

    // --------------------------------------------------
    // FIND QUESTIONS
    // --------------------------------------------------

    const questions = await Question.find(filter);

    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully",
      data: questions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);

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

    // Check whether the ID is a valid MongoDB ObjectId.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {},
      });
    }

    // Find the question.
    const question = await Question.findById(id);

    // Question does not exist.
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
    console.error("Error fetching question:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch question",
      data: {},
    });
  }
};

// ======================================================
// CREATE A NEW QUESTION
// ======================================================
// ONLY AUTHENTICATED TEACHERS CAN CREATE QUESTIONS.
//
// Important requirements:
// 1. User must be authenticated.
// 2. User must be a teacher.
// 3. Exam must exist.
// 4. Subject must exist.
// 5. Subject must belong to Exam.
// 6. Topic must exist.
// 7. Topic must belong to Subject.
// 8. Question must have valid options.
// 9. Exactly one option must be correct.
// 10. createdBy comes from req.user._id.
// ======================================================

export const createQuestion = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation,
    } = req.body;

    // --------------------------------------------------
    // 1. CHECK REQUIRED FIELDS
    // --------------------------------------------------

    if (
      !examId ||
      !subjectId ||
      !topicId ||
      !year ||
      !questionText ||
      !options
    ) {
      return res.status(400).json({
        success: false,
        message:
          "examId, subjectId, topicId, year, questionText and options are required",
        data: {},
      });
    }

    // --------------------------------------------------
    // 2. CHECK OBJECT IDS
    // --------------------------------------------------

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId",
        data: {},
      });
    }

    if (!mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subjectId",
        data: {},
      });
    }

    if (!mongoose.isValidObjectId(topicId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid topicId",
        data: {},
      });
    }

    // --------------------------------------------------
    // 3. CHECK THAT THE EXAM EXISTS
    // --------------------------------------------------

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(400).json({
        success: false,
        message: "Selected exam does not exist",
        data: {},
      });
    }

    // --------------------------------------------------
    // 4. CHECK THAT THE SUBJECT EXISTS
    // --------------------------------------------------

    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Selected subject does not exist",
        data: {},
      });
    }

    // --------------------------------------------------
    // 5. CHECK SUBJECT → EXAM RELATIONSHIP
    // --------------------------------------------------
    // A subject belongs to an exam through subject.examId.
    //
    // Example:
    //
    // JAMB
    //   ↓
    // Mathematics
    //
    // Mathematics.examId must match examId.
    // --------------------------------------------------

    if (subject.examId.toString() !== examId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Selected subject does not belong to the selected exam",
        data: {},
      });
    }

    // --------------------------------------------------
    // 6. CHECK THAT THE TOPIC EXISTS
    // --------------------------------------------------

    const topic = await Topic.findById(topicId);

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Selected topic does not exist",
        data: {},
      });
    }

    // --------------------------------------------------
    // 7. CHECK TOPIC → SUBJECT RELATIONSHIP
    // --------------------------------------------------
    // A topic belongs to a subject through topic.subjectId.
    //
    // Example:
    //
    // Mathematics
    //      ↓
    // Algebra
    //
    // Algebra.subjectId must match subjectId.
    // --------------------------------------------------

    if (topic.subjectId.toString() !== subjectId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Selected topic does not belong to the selected subject",
        data: {},
      });
    }

    // --------------------------------------------------
    // 8. CHECK OPTIONS
    // --------------------------------------------------

    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Question must have between 2 and 4 options",
        data: {},
      });
    }

    // --------------------------------------------------
    // 9. CHECK CORRECT ANSWER
    // --------------------------------------------------
    // Exactly ONE option must have isCorrect = true.
    // --------------------------------------------------

    const correctOptions = options.filter(
      (option) => option.isCorrect === true
    );

    if (correctOptions.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "Question must have exactly one correct answer",
        data: {},
      });
    }

    // --------------------------------------------------
    // 10. CREATE QUESTION
    // --------------------------------------------------
    // IMPORTANT:
    //
    // createdBy comes from req.user._id.
    //
    // We do NOT allow the frontend to decide who created
    // the question.
    // --------------------------------------------------

    const question = await Question.create({
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation,

      // Authenticated teacher's ID.
      createdBy: req.user._id,
    });

    // --------------------------------------------------
    // 11. RETURN SUCCESS
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    console.error("Error creating question:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create question",
      data: {},
    });
  }
};

// ======================================================
// UPDATE AN EXISTING QUESTION
// ======================================================

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Check question ID.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
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

    // Update the question.
    const question = await Question.findByIdAndUpdate(
      id,
      {
        examId,
        subjectId,
        topicId,
        year,
        questionText,
        options,
        explanation,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Question does not exist.
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    console.error("Error updating question:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      data: {},
    });
  }
};

// ======================================================
// DELETE AN EXISTING QUESTION
// ======================================================

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Check question ID.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {},
      });
    }

    // Delete the question.
    const question = await Question.findByIdAndDelete(id);

    // Question does not exist.
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: question,
    });
  } catch (error) {
    console.error("Error deleting question:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      data: {},
    });
  }
};