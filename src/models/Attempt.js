import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },

    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
    ],

    mode: {
      type: String,
      enum: ['practice', 'timed-cbt'],
      default: 'practice',
    },

    status: {
      type: String,
      enum: ['in-progress', 'completed', 'auto-submitted', 'submitted'],
      default: 'in-progress',
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    correctCount: {
      type: Number,
      default: 0,
      min: 0,
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

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

attemptSchema.index({
  userId: 1,
  subjectId: 1,
  createdAt: -1,
});

export default mongoose.model('Attempt', attemptSchema);