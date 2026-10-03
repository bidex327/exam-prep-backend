import mongoose from "mongoose";

const practiceSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },

    numberOfQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// CALCULATE ACCURACY BEFORE SAVING
// ======================================================
// Accuracy is calculated from the score and the total
// number of questions.
//
// Example:
// 8 correct out of 10 questions = 80%
//
// We calculate this automatically on the backend so the
// value stored in the database is consistent.
// ======================================================

practiceSessionSchema.pre("save", function () {
  this.accuracy =
    this.numberOfQuestions > 0
      ? Math.round((this.score / this.numberOfQuestions) * 100)
      : 0;
});

// Export the PracticeSession model.
export default mongoose.model("PracticeSession", practiceSessionSchema);