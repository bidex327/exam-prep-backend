import Subject from "../models/Subject.js";

export const updateOnboarding = async (req, res) => {
  try {
    const { targetExam, selectedSubjects } = req.body;

    // Check target exam
    if (!targetExam) {
      return res.status(400).json({
        success: false,
        message: "targetExam is required",
        data: {},
      });
    }

    // Check subjects
    if (!Array.isArray(selectedSubjects)) {
      return res.status(400).json({
        success: false,
        message: "selectedSubjects must be an array",
        data: {},
      });
    }

    // User must select exactly 4 subjects
    if (selectedSubjects.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "You must select exactly 4 subjects",
        data: {},
      });
    }

    // Find the selected subjects that belong to the target exam
    const subjects = await Subject.find({
      _id: { $in: selectedSubjects },
      examId: targetExam,
    });

    // Make sure all 4 selected subjects are valid
    if (subjects.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Some selected subjects are invalid for the target exam",
        data: {},
      });
    }

    // English is the compulsory subject
    const hasEnglish = subjects.some(
      (subject) => subject.isCompulsory === true
    );

    if (!hasEnglish) {
      return res.status(400).json({
        success: false,
        message: "English must be one of the selected subjects",
        data: {},
      });
    }

    // Update logged-in user's onboarding information
    req.user.targetExam = targetExam;
    req.user.selectedSubjects = selectedSubjects;

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      data: {
        targetExam: req.user.targetExam,
        selectedSubjects: req.user.selectedSubjects,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};