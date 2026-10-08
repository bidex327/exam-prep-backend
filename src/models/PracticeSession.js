import mongoose from "mongoose";

const praticeAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      require: true
    },
    selectedAnswer: {
      type: string,
      required: true
    },
    correctAnswer: {
      type: string,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    answerAt: {
      type: Date,
      default: Date.now
    }
  }, { _id: true}
)


const practiceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },

    question: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
      }
    ],

    answer: [practiceSessionSchema],
    
    numberOfQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    correctAnswer: {
      type: Number,
      required: true,
      default: 0
    },

    score: {
      type: Number,
      required: true,
      default: null,
      min: 0,
    },

    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      eunm: [
        "in_progress","completed"
      ],
      default: "in_progress",
      index: true
    }
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