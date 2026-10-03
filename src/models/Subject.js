import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },

    isCompulsory: { type: Boolean, default: false }, // for English
  },
  { timestamps: true }
);

subjectSchema.index({ name: 1, examId: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
