
import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
    },

    questionType: {
      type: String,
      enum: ["multiple-choice"],
      default: "multiple-choice",
      required: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [optionSchema],
      required: true,
      validate: [
        {
          validator: function (options) {
            return options.length >= 2 && options.length <= 4;
          },
          message: "A question must have between 2 and 4 options",
        },
        {
          validator: function (options) {
            return options.filter((option) => option.isCorrect).length === 1;
          },
          message: "A question must have exactly one correct answer",
        },
      ],
    },

    explanation: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

questionSchema.index({ examId: 1, subjectId: 1, year: 1 });

export default mongoose.model("Question", questionSchema);
