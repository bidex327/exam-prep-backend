
import mongoose from "mongoose";
import Question from "../models/question.js";

// GET /api/admin/questions
export const getAdminQuestions = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      topicId,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Validate filter IDs
    for (const [field, value] of Object.entries({
      examId,
      subjectId,
      topicId,
    })) {
      if (value && !mongoose.isValidObjectId(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}`,
        });
      }
    }

    if (examId) filter.examId = examId;
    if (subjectId) filter.subjectId = subjectId;
    if (topicId) filter.topicId = topicId;

    if (status) {
      if (!["draft", "published"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be draft or published",
        });
      }

      filter.status = status;
    }

    if (search?.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.questionText = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate("examId", "name code")
        .populate("subjectId", "name")
        .populate("topicId", "name")
        .populate("createdBy", "fullName emailOrPhone")
        .lean(),

      Question.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin questions retrieved successfully",
      data: {
        questions,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("GET ADMIN QUESTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve admin questions",
    });
  }
};

// GET /api/admin/questions/:id
export const getAdminQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await Question.findById(id)
      .populate("examId", "name code")
      .populate("subjectId", "name")
      .populate("topicId", "name")
      .populate("createdBy", "fullName emailOrPhone")
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Admins can see options[].isCorrect.
    return res.status(200).json({
      success: true,
      message: "Admin question retrieved successfully",
      data: question,
    });
  } catch (error) {
    console.error("GET ADMIN QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve admin question",
    });
  }
};


 // PATCH /api/admin/questions/:id/status
export const updateAdminQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be draft or published",
      });
    }

    const question = await Question.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("examId", "name code")
      .populate("subjectId", "name")
      .populate("topicId", "name")
      .populate("createdBy", "fullName emailOrPhone")
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        status === "published"
          ? "Question published successfully"
          : "Question unpublished successfully",
      data: question,
    });
  } catch (error) {
    console.error("UPDATE ADMIN QUESTION STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update question status",
    });
  }
};
