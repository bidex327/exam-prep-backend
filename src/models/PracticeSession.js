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
      default: null,
      min: 0,
    },

    accuracy: {
      type: Number,
      default: null,
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

// Calculate accuracy only when a score exists.
practiceSessionSchema.pre("save", function () {
  if (this.score === null || this.score === undefined) {
    this.accuracy = null;
    return;
  }

  this.accuracy =
    this.numberOfQuestions > 0
      ? Math.round((this.score / this.numberOfQuestions) * 100)
      : null;
});

export default mongoose.model("PracticeSession", practiceSessionSchema);