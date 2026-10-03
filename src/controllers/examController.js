import Exam from "../models/Exam.js";

// Create a new exam
export const createExam = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const exam = await Exam.create({
      name,
      code,
      description
    });

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam
    });
  } catch (error) {
    console.error("Error creating exam:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create exam",
      data: {}
    });
  }
};

// Get all exams
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find();

    return res.status(200).json({
      success: true,
      message: "Exams fetched successfully",
      data: exams
    });
  } catch (error) {
    console.error("Error fetching exams:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      data: {}
    });
  }
};