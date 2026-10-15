import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    profilePicture: {
      type: String,
      default: "",
      trim: true,
    },
    profilePicturePublicId: {
  type: String,
  default: "",
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
    timezone: {
  type: String,
  trim: true,
  default: "Africa/Lagos",
},

location: {
  type: String,
  trim: true,
  default: "",
},

   password: {
  type: String,
  required: function () {
    return !this.googleId;
  },
  select: false,
},
googleId: {
  type: String,
  unique: true,
  sparse: true,
},

    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },

    targetExam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },

    selectedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
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

    // Email verification
    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },
        // Password reset
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);