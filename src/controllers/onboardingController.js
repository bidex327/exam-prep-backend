import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";

export const updateOnboarding = async (req, res) => {
  try {
    const { targetExam, selectedSubjects } = req.body;

    // 1. Check target exam
    if (!targetExam) {
      return res.status(400).json({
        success: false,
        message: "targetExam is required",
        data: {},
      });
    }

    // 2. Check subjects
    if (!Array.isArray(selectedSubjects)) {
      return res.status(400).json({
        success: false,
        message: "selectedSubjects must be an array",
        data: {},
      });
    }

    // 3. Student must select exactly 4 subjects
    if (selectedSubjects.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "You must select exactly 4 subjects",
        data: {},
      });
    }

    // 4. Prevent duplicate subjects
    const uniqueSubjects = [...new Set(selectedSubjects.map(String))];

    if (uniqueSubjects.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Selected subjects must be different",
        data: {},
      });
    }

    // 5. Check that the target exam exists
    const exam = await Exam.findById(targetExam);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Target exam not found",
        data: {},
      });
    }

    // 6. Find subjects that belong to the selected exam
    const subjects = await Subject.find({
      _id: { $in: uniqueSubjects },
      examId: targetExam,
    });

    // 7. Make sure all 4 subjects belong to the exam
    if (subjects.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Some selected subjects are invalid for the target exam",
        data: {},
      });
    }

    // 8. English must be selected
    const hasCompulsorySubject = subjects.some(
      (subject) => subject.isCompulsory === true
    );

    if (!hasCompulsorySubject) {
      return res.status(400).json({
        success: false,
        message: "English must be one of the selected subjects",
        data: {},
      });
    }

    // 9. Update the authenticated user's onboarding information
    req.user.targetExam = targetExam;
    req.user.selectedSubjects = uniqueSubjects;

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
    console.error("ONBOARDING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};