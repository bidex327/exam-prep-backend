import mongoose from "mongoose";

const attemptAnswerSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      index: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },

    selectedOption: {
      type: String,
      trim: true,
      default: null,
    },

    isCorrect: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

// A question should only be answered once within one attempt.
attemptAnswerSchema.index(
  { attemptId: 1, questionId: 1 },
  { unique: true }
);

export default mongoose.model("AttemptAnswer", attemptAnswerSchema);