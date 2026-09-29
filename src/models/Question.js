import mongoose from 'mongoose';


export const optionSchema = new mongoose.Schema({
  label: { type: String, required: true }, 
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false }
});


export const questionSchema = new mongoose.Schema(
  {
    examId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Exam', 
      required: true 
    },
    subjectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Subject', 
      required: true 
    },
    topicId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Topic', 
      required: true 
    },
    year: { 
      type: Number, 
      required: true 
    },
    questionText: { 
      type: String, 
      required: true, 
      trim: true 
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function(val) {
          return val.length >= 2 && val.length <= 4;
        },
        message: 'A question must have between 2 and 4 options'
      }
    },
    explanation: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);


questionSchema.index({ examId: 1, subjectId: 1, year: 1 });

export default mongoose.model('Question', questionSchema);