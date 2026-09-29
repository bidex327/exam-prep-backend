import Question from "../models/Question.js";

// Get all questions, with optional filters
export const getQuestions = async (req, res) => {
  try {
    // Get filter values from the URL query
    // Example: /api/questions?subjectId=123&year=2023
    const { examId, subjectId, topicId, year } = req.query;

    // Start with an empty filter
    const filter = {};

    // Add a filter only when the value is provided
    if (examId) filter.examId = examId;
    if (subjectId) filter.subjectId = subjectId;
    if (topicId) filter.topicId = topicId;
    if (year) filter.year = year;

    // Find questions that match the filter
    const questions = await Question.find(filter);

    // Send the questions back to the client
    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully",
      data: questions
    });
  } catch (error) {
    // Handle database/server errors
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      data: {}
    });
  }
};


// Get one question using its MongoDB ID
export const getQuestionById = async (req, res) => {
  try {
    // Get the ID from the URL
    // Example: /api/questions/65abc123
    const { id } = req.params;

    // Search MongoDB for the question
    const question = await Question.findById(id);

    // If the question doesn't exist
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    // Return the question
    return res.status(200).json({
      success: true,
      message: "Question fetched successfully",
      data: question
    });
  } catch (error) {
    // Handle database/server errors
    return res.status(500).json({
      success: false,
      message: "Failed to fetch question",
      data: {}
    });
  }
};


// Create a new question
export const createQuestion = async (req, res) => {
  try {
    // Get question data from the request body
    const {
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    } = req.body;

    // Create and save the question in MongoDB
    const question = await Question.create({
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    });

    // Return the newly created question
    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question
    });
  } catch (error) {
    // Handle validation/database errors
    return res.status(500).json({
      success: false,
      message: "Failed to create question",
      data: {}
    });
  }
};


// Update an existing question
export const updateQuestion = async (req, res) => {
  try {
    // Get the question ID from the URL
    // Example: PUT /api/questions/65abc123
    const { id } = req.params;

    // Get updated information from the request body
    const {
      examId,
      subjectId,
      topicId,
      year,
      questionText,
      options,
      explanation
    } = req.body;

    // Find the question by ID and update it
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

    // If the question doesn't exist
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    // Return the updated question
    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question
    });
  } catch (error) {
    // Handle validation/database errors
    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      data: {}
    });
  }
};


// Delete an existing question
export const deleteQuestion = async (req, res) => {
  try {
    // Get the question ID from the URL
    // Example: DELETE /api/questions/65abc123
    const { id } = req.params;

    // Find the question by ID and delete it
    const question = await Question.findByIdAndDelete(id);

    // If the question doesn't exist
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
        data: {}
      });
    }

    // Return the deleted question as confirmation
    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: question
    });
  } catch (error) {
    // Handle database/server errors
    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      data: {}
    });
  }
};