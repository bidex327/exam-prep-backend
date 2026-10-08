import mongoose from "mongoose";

// ======================================================
// OPTION SCHEMA
// ======================================================
// Each question can have between 2 and 4 options.
// Example:
// A → Lagos
// B → Abuja
// C → Kano
// D → Enugu
// ======================================================

const optionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },

  text: {
    type: String,
    required: true,
  },

  // This tells the backend which option is correct.
  isCorrect: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// ======================================================
// QUESTION SCHEMA
// ======================================================

const questionSchema = new mongoose.Schema(
  {
    // The exam this question belongs to.
    // Example: JAMB, WAEC, NECO.
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    // The subject this question belongs to.
    // Example: Mathematics, Physics, English.
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // The topic this question belongs to.
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    // The teacher who created/uploaded the question.
    //
    // IMPORTANT:
    // This will come from req.user._id.
    // The frontend should NOT provide this value.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The year the question belongs to.
    year: {
      type: Number,
      required: true,
    },

    // The actual question.
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    // Question options.
    //
    // A question must have between 2 and 4 options.
    options: {
      type: [optionSchema],

      validate: {
        validator: function (val) {
          return val.length >= 2 && val.length <= 4;
        },

        message: "A question must have between 2 and 4 options",
      },
    },

    // Explanation of the correct answer.
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
  },

  { timestamps: true }
);

// ======================================================
// DATABASE INDEX
// ======================================================

questionSchema.index({
  examId: 1,
  subjectId: 1,
  year: 1,
});

// ======================================================
// EXPORT QUESTION MODEL
// ======================================================

export default mongoose.model("Question", questionSchema);