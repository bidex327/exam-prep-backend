import mongoose from 'mongoose';


const optionSchema = new mongoose.Schema({
  label: { type: String, required: true }, 
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false },
},
{_id: false } // Prevents Mongoose from creating an _id for each option
);


const questionSchema = new mongoose.Schema(
  {
    examId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Exam', 
      required: true,
      index: true 
    },
    subjectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Subject', 
      required: true,
      index: true
    },
    topicId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Topic', 
      required: true,
      index: true
    },

    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    
    
    questionText: { 
      type: String, 
      required: true, 
      trim: true,
    },
    
    options: {
      type: [optionSchema],
      validate: {
        validator: (v) => 
          Array.isArray(v) && 
          v.length >= 2 && 
          v.length <= 4 && 
          v.filter((o) => o.isCorrect).length === 1,
        message: 'A question must have between 2 and 4 options'
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: ''
    },
    year: {
      type: Number,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

questionSchema.index({ examId: 1, subjectId: 1, year: 1 });

export default mongoose.model('Question', questionSchema);