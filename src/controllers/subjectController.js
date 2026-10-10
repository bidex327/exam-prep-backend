import mongoose from "mongoose";

import Subject from "../models/Subject.js";
import Exam from "../models/Exam.js";

// ======================================================
// CREATE SUBJECT
// ======================================================

export const createSubject = async (req, res) => {
  try {
    const { name, examId, isCompulsory } = req.body;

    if (!name || !examId) {
      return res.status(400).json({
        success: false,
        message: "name and examId are required",
        data: {},
      });
    }

    // Validate examId format
    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId",
        data: {},
      });
    }

    // Make sure the exam exists
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
        data: {},
      });
    }

    const subject = await Subject.create({
      name,
      examId,
      isCompulsory: isCompulsory === true,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    console.error("CREATE SUBJECT ERROR:", error);

    // Handle duplicate subject for the same exam
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A subject with this name already exists for this exam",
        data: {},
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create subject",
      data: {},
    });
  }
};

// ======================================================
// GET SUBJECTS
// ======================================================

export const getSubjects = async (req, res) => {
  try {
    const { examId } = req.query;

    const match = {};

    if (examId) {
      if (!mongoose.isValidObjectId(examId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examId",
          data: {},
        });
      }

      match.examId = new mongoose.Types.ObjectId(examId);
    }

    const subjects = await Subject.aggregate([
      // -----------------------------------------------
      // Filter subjects
      // -----------------------------------------------
      {
        $match: match,
      },

      // -----------------------------------------------
      // Count questions belonging to each subject
      // -----------------------------------------------
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "subjectId",
          as: "questions",
        },
      },

      // -----------------------------------------------
      // Return only the information the frontend needs
      // -----------------------------------------------
      {
        $project: {
          _id: 0,
          subjectId: "$_id",
          name: 1,
          examId: 1,
          isCompulsory: 1,
          questionCount: {
            $size: "$questions",
          },
        },
      },

      // -----------------------------------------------
      // Sort alphabetically
      // -----------------------------------------------
      {
        $sort: {
          name: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
    });
  } catch (error) {
    console.error("GET SUBJECTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      data: {},
    });
  }
};