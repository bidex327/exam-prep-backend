
import mongoose from 'mongoose';
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    emailOrPhone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },

    targetExam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
    },

    selectedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],

    questionsAttempted: {
      type: Number,
      default: 0,
      min: 0,
    },

    studyStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActiveDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
