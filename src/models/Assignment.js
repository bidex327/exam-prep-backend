import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        index: true
      }
    ],
    postDate:{
        type: Date,
        required: true,
        default: null
    },
    dueDate: {
      type: Date,
      required: true,
      default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'overdue'],
        default: 'pending',
        index: true
    },
    
  },
  { timestamps: true },
);

assignmentSchema.path("questions").validate(function (questions)
    {
        const questionIds = questions.map((id) => id.toString());
        return questionIds.length === new Set(questionIds).size;
    }
)
const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;