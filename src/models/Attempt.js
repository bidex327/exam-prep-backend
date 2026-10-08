import mongoose from 'mongoose';

// FOR THE ATTEMPT SCHEMA.
const attemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    mode: {
      type: String,
      enum: ["practice", "timed-cbt"],
      default: "practice",
    },

    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    correctPercent: {
      type: Number,
      default: 0,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    // practiceSession: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "PracticeSession",
    //   required: true,
    // },
    selectedAnswer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },

    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    accuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["in-progress", "completed", "auto-submitted", "submitted"],
      default: "in-progress",
    }
  },
  { timestamps: true },
);
attemptSchema.index({ user: 1, subject: 1, createdAt: -1})
export default mongoose.model("Attempt", attemptSchema)