import mongoose from "mongoose";
import Question from "../models/Question.js";




export const getQuestions = async (req, res) => {
  try {

    const { examId, subjectId, topicId, year } = req.query;

    // Start with an empty filter object.
    const filter = {};

    // Filter by examId
    if (examId) {
      if (!mongoose.isValidObjectId(examId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examId",
          data: {}
        });
      }
      filter.examId = examId;
    }

    // Filter by subjectId
    if (subjectId) {
      if (!mongoose.isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId",
          data: {}
        });
      }
      filter.subjectId = subjectId;
    }

    // Filter by topicId
    if (topicId) {
      if (!mongoose.isValidObjectId(topicId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid topicId",
          data: {}
        });
      }
      filter.topicId = topicId;
    }

    // Filter by year
    if (year) {
      const numericYear = Number(year);
      if (!Number.isInteger(numericYear)) {
        return res.status(400).json({
          success: false,
          message: "Year must be a valid number",
          data: {}
        });
      }
      filter.year = numericYear;
    }

    // Find questions using all supplied filters
    const questions = await Question.find(filter);

    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully",
      data: questions
    });

  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      data: {}
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
        data: {}
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question fetched successfully",
      data: question
    });

  } catch (error) {
    console.error("Error fetching question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch question",
      data: {}
    });
  }
};


// ======================================================
// CREATE A NEW QUESTION
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
      explanation
    } = req.body;

    const question = await Question.create({
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    });

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question
    });

  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create question",
      data: {}
    });
  }
};


// ======================================================
// UPDATE AN EXISTING QUESTION
// ======================================================

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {}
      });
    }

    const {
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    } = req.body;

    const question = await Question.findByIdAndUpdate(
      id,
      {
        examId,
        subjectId,
        topicId,
        year,
        questionText,
        options,
        explanation
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question
    });

  } catch (error) {
    console.error("Error updating question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      data: {}
    });
  }
};


// ======================================================
// DELETE AN EXISTING QUESTION
// ======================================================

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {}
      });
    }

    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: question
    });

  } catch (error) {
    console.error("Error deleting question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      data: {}
    });
  }
};