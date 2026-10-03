import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, 

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

topicSchema.index({ name: 1, subjectId: 1 }, { unique: true });

export default mongoose.model('Topic', topicSchema);
