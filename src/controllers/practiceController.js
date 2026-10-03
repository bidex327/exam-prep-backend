import Question from "../models/question.js";
import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import PracticeSession from "../models/PracticeSession.js";

// ======================================================
// GET PRACTICE QUESTIONS
// ======================================================
// Retrieves questions for a practice session.
//
// Supported filters:
// - examId
// - subjectId
// - topicId
// - year
//
// IMPORTANT:
// The correct answer and explanation are removed before
// sending questions to the student.
// ======================================================

const getPracticeQuestions = async (req, res) => {
  try {
    // Get filters from the URL query parameters.
    const { examId, subjectId, topicId, year } = req.query;

    // Create an empty filter object.
    const filter = {};

    // Add examId if provided.
    if (examId) {
      filter.examId = examId;
    }

    // Add subjectId if provided.
    if (subjectId) {
      filter.subjectId = subjectId;
    }

    // Add topicId if provided.
    if (topicId) {
      filter.topicId = topicId;
    }

    // Add year if provided.
    if (year) {
      filter.year = Number(year);
    }

    // Get questions from MongoDB.
    //
    // lean() converts Mongoose documents into normal
    // JavaScript objects.
    const questions = await Question.find(filter).lean();

    // Remove sensitive information before sending
    // questions to the student.
    const practiceQuestions = questions.map((question) => {
      // Remove the explanation.
      const { explanation, ...safeQuestion } = question;

      // Remove isCorrect from every option.
      safeQuestion.options = safeQuestion.options.map((option) => {
        const { isCorrect, ...safeOption } = option;

        return safeOption;
      });

      return safeQuestion;
    });

    // Send the safe questions to the frontend.
    res.status(200).json({
      success: true,
      message: "Practice questions fetched successfully",
      data: practiceQuestions,
    });
  } catch (error) {
    // Handle unexpected errors.
    res.status(500).json({
      success: false,
      message: "Failed to fetch practice questions",
      data: {},
    });
  }
};

// ======================================================
// SUBMIT PRACTICE
// ======================================================
// Receives a student's selected answers.
//
// The backend:
// 1. Gets the questions from MongoDB.
// 2. Checks the real correct answers.
// 3. Calculates the score.
// 4. Calculates accuracy.
// 5. Creates an Attempt.
// 6. Creates AttemptAnswer records.
// 7. Creates a PracticeSession.
//
// IMPORTANT:
// We NEVER trust "isCorrect" sent by the frontend.
// The correct answer always comes from the database.
// ======================================================

const submitPractice = async (req, res) => {
  try {
    // Get the authenticated student's ID.
    // This comes from the JWT middleware.
    const studentId = req.user._id;

    // Get submitted answers from the request body.
    //
    // Expected format:
    // {
    //   "answers": [
    //     {
    //       "questionId": "QUESTION_ID",
    //       "selectedOption": "B"
    //     }
    //   ]
    // }
    const { answers } = req.body;

    // Make sure answers was provided as an array.
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Answers must be a non-empty array",
        data: {},
      });
    }

    // Get all question IDs submitted by the student.
    const questionIds = answers.map((answer) => answer.questionId);

    // Find the actual questions in MongoDB.
    const questions = await Question.find({
      _id: { $in: questionIds },
    });

    // Make sure every submitted question exists.
    if (questions.length !== answers.length) {
      return res.status(400).json({
        success: false,
        message: "One or more question IDs are invalid",
        data: {},
      });
    }

    // --------------------------------------------------
    // CHECK THAT ALL QUESTIONS BELONG TO ONE SESSION
    // --------------------------------------------------
    // PracticeSession currently stores only one topicId.
    // Therefore, all questions in one submission must
    // belong to the same exam, subject and topic.

    const firstQuestion = questions[0];

    const sameSession = questions.every((question) => {
      return (
        question.examId.toString() === firstQuestion.examId.toString() &&
        question.subjectId.toString() === firstQuestion.subjectId.toString() &&
        question.topicId.toString() === firstQuestion.topicId.toString()
      );
    });

    if (!sameSession) {
      return res.status(400).json({
        success: false,
        message:
          "All questions in a practice submission must belong to the same exam, subject and topic",
        data: {},
      });
    }

    // --------------------------------------------------
    // CALCULATE SCORE
    // --------------------------------------------------

    let correctCount = 0;

    // Store the result for each submitted answer.
    const answerResults = [];

    // Check every submitted answer.
    for (const submittedAnswer of answers) {
      // Find the question that belongs to this answer.
      const question = questions.find(
        (item) => item._id.toString() === submittedAnswer.questionId
      );

      // Find the correct option stored in the database.
      const correctOption = question.options.find(
        (option) => option.isCorrect === true
      );

      // Compare the student's selected option with
      // the correct option from the database.
      const isCorrect =
        correctOption &&
        submittedAnswer.selectedOption === correctOption.label;

      // Increase the score when the answer is correct.
      if (isCorrect) {
        correctCount++;
      }

      // Store the result temporarily.
      answerResults.push({
        questionId: question._id,
        topicId: question.topicId,
        selectedOption: submittedAnswer.selectedOption || null,
        isCorrect: Boolean(isCorrect),
      });
    }

    // Total number of questions.
    const totalQuestions = answers.length;

    // Calculate accuracy as a percentage.
    const correctPercent = Math.round(
      (correctCount / totalQuestions) * 100
    );

    // --------------------------------------------------
    // CREATE ATTEMPT
    // --------------------------------------------------

    const attempt = await Attempt.create({
      userId: studentId,
      examId: firstQuestion.examId,
      subjectId: firstQuestion.subjectId,
      mode: "practice",
      status: "completed",
      totalQuestions,
      correctCount,
      correctPercent,
      submittedAt: new Date(),
    });

    // --------------------------------------------------
    // CREATE ATTEMPT ANSWERS
    // --------------------------------------------------

    const attemptAnswers = answerResults.map((answer) => ({
      attemptId: attempt._id,
      questionId: answer.questionId,
      topicId: answer.topicId,
      selectedOption: answer.selectedOption,
      isCorrect: answer.isCorrect,
    }));

    await AttemptAnswer.insertMany(attemptAnswers);

    // --------------------------------------------------
    // CREATE PRACTICE SESSION
    // --------------------------------------------------

    const practiceSession = await PracticeSession.create({
      studentId,
      topicId: firstQuestion.topicId,
      numberOfQuestions: totalQuestions,
      score: correctCount,
      accuracy: correctPercent,
    });

    // --------------------------------------------------
    // RETURN RESULT
    // --------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Practice submitted successfully",
      data: {
        attemptId: attempt._id,
        practiceSessionId: practiceSession._id,
        totalQuestions,
        correctCount,
        accuracy: correctPercent,
      },
    });
  } catch (error) {
    // Log the actual error in the server terminal
    // to make debugging easier during development.
    console.error("Submit practice error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit practice",
      data: {},
    });
  }
};

// Export both Practice API controllers.
export {
  getPracticeQuestions,
  submitPractice,
};