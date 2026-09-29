import mongoose from 'mongoose';
import question from './question';

export const attemptAnswerSchema = new mongoose.Schema(
    {
        attemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attempt',
            required: true
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        
    }
)