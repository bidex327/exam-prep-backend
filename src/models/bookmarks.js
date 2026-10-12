import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
{
userId: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
},

questionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Question",
  required: true,
},


},
{ timestamps: true }
);

// Prevent a user from bookmarking the same question more than once.
bookmarkSchema.index(
{ userId: 1, questionId: 1 },
{ unique: true }
);

export default mongoose.model("Bookmark", bookmarkSchema);
