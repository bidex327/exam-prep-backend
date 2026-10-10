import Exam from "../models/Exam.js";

// ======================================================
// CREATE EXAM
// ======================================================

export const createExam = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "name and code are required",
        data: {},
      });
    }

    const exam = await Exam.create({
      name,
      code,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error) {
    console.error("CREATE EXAM ERROR:", error);

    // Duplicate exam code
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An exam with this code already exists",
        data: {},
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create exam",
      data: {},
    });
  }
};

// ======================================================
// GET ALL EXAMS
// ======================================================

export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Exams fetched successfully",
      data: exams,
    });
  } catch (error) {
    console.error("GET EXAMS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      data: {},
    });
  }
};