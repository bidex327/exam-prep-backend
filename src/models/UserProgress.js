import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    activeSubjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    activeTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
      index: true,
    },

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One active progress record per user per subject.
userProgressSchema.index(
  { userId: 1, activeSubjectId: 1 },
  { unique: true }
);

export default mongoose.model("UserProgress", userProgressSchema);