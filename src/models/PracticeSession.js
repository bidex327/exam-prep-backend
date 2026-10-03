import mongoose from 'mongoose';

const practiceSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },

    numberOfQuestions: { type: Number, required: true, min: 1 },

    score: { type: Number, required: true, min: 0 },

    accuracy: { type: Number, default: 0, min: 0, max: 100 },

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

practiceSessionSchema.pre('save', function recalcAccuracy(next) {
  this.accuracy =
    this.numberOfQuestions > 0
      ? Math.round((this.score / this.numberOfQuestions) * 100)
      : 0;
  next();
});

export default mongoose.model('PracticeSession', practiceSessionSchema);
