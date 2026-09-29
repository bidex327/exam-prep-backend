import mongoose from "mongoose";


const userProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        activeSubjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true
        },
        activeTopicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic',
            required: true,
            default: null
        },
        progressPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        LastActivity: {
            type: Date,
            default: Date.now
        },
    },
    { timestamps: true }
    
)
userProgressSchema.index({ userId: 1, activeSubjectId: 1 },{ unique: true })

export default mongoose.model('UserProgress', userProgressSchema);