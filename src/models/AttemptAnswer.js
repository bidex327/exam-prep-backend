import mongoose from "mongoose";

export const attemptAnswerSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    topic: {
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

    //HOW INDIVIDUAL ANSWER ARE STORED
    answerTakenStore: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true },
);

attemptAnswerSchema.index({ attempt: 1 });
attemptAnswerSchema.index({ question: 1 });

export default mongoose.model("AttemptAnswer", attemptAnswerSchema);
