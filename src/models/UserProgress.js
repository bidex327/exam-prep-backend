import mongoose from "mongoose";

const topicProgressSchema = new mongoose.Schema(
    {
        activeTopic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            required: true,
            default: null
        },
        activeSubject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },
        totalQuestion: {
            type: Number,
            default: 0
        },
        correctAnswer: {
            type: Number,
            default: 0
        },
        progressPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        attempts:{
            type: Number,
            default: 0
        },
        lastAttempt: {
            type: Data,
            default: null
        }
    }, { _id: false}
)

const userProgressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        topics:[topicProgressSchema],

        LastActivity: {
            type: Date,
            default: Date.now
        },
    },
    { timestamps: true }
    
)
userProgressSchema.index({ user: 1, activeSubject: 1 },{ unique: true })

export default mongoose.model('UserProgress', userProgressSchema);