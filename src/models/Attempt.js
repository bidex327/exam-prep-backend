import mongoose from 'mongoose';

// FOR THE ATTEMPT SCHEMA.
export const attemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    mode: {
        type: String,
        enum: ['practice', 'timed-cbt'],
        default: 'practice'
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'auto-submitted', 'submitted'],
        default: 'in-progress'
    },
    totalQuestions: {
        type: Number,
        required: true,
    },
    correctCount: {
        type: Number,
        default: 0
    },
    correctPercent: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    submittedAt: {
        type: Date,
        required: true,
        default: null
    },

}, { timestamps: true }

)
attemptSchema.index({ userId: 1, subjectId: 1, createdAt: -1})
export default mongoose.model("Attempt", attemptSchema)