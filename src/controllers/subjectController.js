import Subject from "../models/Subject.js";

// Create a new subject
export const createSubject = async (req, res) => {
  try {
    const { name, examId, isCompulsory } = req.body;

    const subject = await Subject.create({
      name,
      examId,
      isCompulsory
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject
    });
  } catch (error) {
    console.error("Error creating subject:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create subject",
      data: {}
    });
  }
};

// Get all subjects
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();

    return res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      data: {}
    });
  }
};