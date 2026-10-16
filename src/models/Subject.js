
import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    isCompulsory: {
      type: Boolean,
      default: false,
    },

    icon: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate subject names within the same exam.
subjectSchema.index(
  { name: 1, examId: 1 },
  { unique: true }
);

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
