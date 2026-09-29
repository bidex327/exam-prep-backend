import mongoose from "mongoose";
import Question from "../models/Question.js";

// ======================================================
// GET ALL QUESTIONS + FILTERING
// ======================================================

// Get all questions, with optional filters
export const getQuestions = async (req, res) => {
  try {
    // Get filter values from the URL query parameters.
    //
    // Examples:
    // /api/questions?examId=123
    // /api/questions?subjectId=456
    // /api/questions?topicId=789
    // /api/questions?year=2025
    //
    // Multiple filters can also be combined:
    // /api/questions?examId=123&subjectId=456&year=2025
    const { examId, subjectId, topicId, year } = req.query;

    // Start with an empty filter object.
    // We will add filters only when they are provided.
    const filter = {};

    // --------------------------------------------------
    // Filter by examId
    // --------------------------------------------------

    if (examId) {
      // Check that examId is a valid MongoDB ObjectId.
      if (!mongoose.isValidObjectId(examId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examId",
          data: {}
        });
      }

      filter.examId = examId;
    }

    // --------------------------------------------------
    // Filter by subjectId
    // --------------------------------------------------

    if (subjectId) {
      // Check that subjectId is a valid MongoDB ObjectId.
      if (!mongoose.isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId",
          data: {}
        });
      }

      filter.subjectId = subjectId;
    }

    // --------------------------------------------------
    // Filter by topicId
    // --------------------------------------------------

    if (topicId) {
      // Check that topicId is a valid MongoDB ObjectId.
      if (!mongoose.isValidObjectId(topicId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid topicId",
          data: {}
        });
      }

      filter.topicId = topicId;
    }

    // --------------------------------------------------
    // Filter by year
    // --------------------------------------------------

    if (year) {
      // Query parameters arrive as strings.
      // Convert the year to a number.
      const numericYear = Number(year);

      // Check that the year is a valid whole number.
      if (!Number.isInteger(numericYear)) {
        return res.status(400).json({
          success: false,
          message: "Year must be a valid number",
          data: {}
        });
      }

      filter.year = numericYear;
    }

    // --------------------------------------------------
    // Find questions using all supplied filters
    // --------------------------------------------------

    // If only subjectId is supplied:
    // { subjectId: "..." }
    //
    // If examId + subjectId + year are supplied:
    // {
    //   examId: "...",
    //   subjectId: "...",
    //   year: 2025
    // }
    //
    // MongoDB will return questions matching ALL
    // the supplied conditions.
    const questions = await Question.find(filter);

    // Return the matching questions.
    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully",
      data: questions
    });

  } catch (error) {
    // Log the actual error in the terminal.
    // This helps us debug database/server problems.
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
    // Get the question ID from the URL.
    //
    // Example:
    // GET /api/questions/65abc123
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {}
      });
    }

    // Search MongoDB for the question.
    const question = await Question.findById(id);

    // If the question does not exist.
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    // Return the question.
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
    // Get question data from the request body.
    const {
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    } = req.body;

    // Create and save the question in MongoDB.
    const question = await Question.create({
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    });

    // Return the newly created question.
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
    // Get the question ID from the URL.
    //
    // Example:
    // PUT /api/questions/65abc123
    const { id } = req.params;

    // Check if the ID is valid.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {}
      });
    }

    // Get the updated information from the request body.
    const {
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    } = req.body;

    // Find the question by ID and update it.
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
        // Return the updated document.
        new: true,

        // Run the schema validation rules.
        runValidators: true
      }
    );

    // If the question does not exist.
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    // Return the updated question.
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
    // Get the question ID from the URL.
    //
    // Example:
    // DELETE /api/questions/65abc123
    const { id } = req.params;

    // Check if the ID is valid.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
        data: {}
      });
    }

    // Find the question by ID and delete it.
    const question = await Question.findByIdAndDelete(id);

    // If the question does not exist.
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    // Return the deleted question as confirmation.
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