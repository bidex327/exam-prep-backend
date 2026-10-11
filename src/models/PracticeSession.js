import mongoose from "mongoose";

const topicBreakdownSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    numberOfQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const practiceSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    // Retained for compatibility with sessions containing one topic.
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
      index: true,
    },

    // All topics covered by this session.
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],

    // Accurate performance statistics for each individual topic.
    topicBreakdown: {
      type: [topicBreakdownSchema],
      default: [],
    },

    mode: {
      type: String,
      enum: ["practice", "timed-cbt"],
      required: true,
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

    durationSeconds: {
      type: Number,
      default: 0,
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
  { timestamps: true }
);

practiceSessionSchema.pre("save", function () {
  if (this.score === null || this.score === undefined) {
    this.accuracy = null;
    return;
  }

  this.accuracy =
    this.numberOfQuestions > 0
      ? Math.round(
          (this.score / this.numberOfQuestions) * 100
        )
      : null;
});

export default mongoose.model(
  "PracticeSession",
  practiceSessionSchema
);