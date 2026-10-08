import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, 
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    }, 
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
