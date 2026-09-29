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

    // English validation will be added when the Subject model
    // and English subject identifier are available.

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