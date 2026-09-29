import mongoose from "mongoose";

export const attemptAnswerSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    selectedOption: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true },
);

attemptAnswerSchema.index({ attemptId: 1 });
attemptAnswerSchema.index({ questionId: 1 });

export default mongoose.model("AttemptAnswer", attemptAnswerSchema);
