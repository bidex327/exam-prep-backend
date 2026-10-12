import mongoose from "mongoose";
import Bookmark from "../models/bookmarks.js";
import Question from "../models/question.js";

// POST /api/bookmarks
// Bookmark a question
export const createBookmark = async (req, res) => {
try {
const { questionId } = req.body;
const userId = req.user._id;


if (!mongoose.Types.ObjectId.isValid(questionId)) {
  return res.status(400).json({
    success: false,
    message: "A valid question ID is required.",
  });
}

const questionExists = await Question.exists({ _id: questionId });

if (!questionExists) {
  return res.status(404).json({
    success: false,
    message: "Question not found.",
  });
}

const existingBookmark = await Bookmark.findOne({
  userId,
  questionId,
});

if (existingBookmark) {
  return res.status(409).json({
    success: false,
    message: "You have already bookmarked this question.",
  });
}

const bookmark = await Bookmark.create({
  userId,
  questionId,
});

return res.status(201).json({
  success: true,
  message: "Question bookmarked successfully.",
  data: bookmark,
});


} catch (error) {
// Handle a duplicate bookmark if simultaneous requests occur.
if (error.code === 11000) {
return res.status(409).json({
success: false,
message: "You have already bookmarked this question.",
});
}


console.error("Create bookmark error:", error);

return res.status(500).json({
  success: false,
  message: "Failed to bookmark question.",
});


}
};

// GET /api/bookmarks
// Retrieve the logged-in user's bookmarks
export const getBookmarks = async (req, res) => {
try {
const bookmarks = await Bookmark.find({
userId: req.user._id,
})
.populate({
path: "questionId",
select:
"examId subjectId topicId year questionType questionText options explanation",
populate: [
{ path: "examId", select: "name code" },
{ path: "subjectId", select: "name" },
{ path: "topicId", select: "name" },
],
})
.sort({ createdAt: -1 });


return res.status(200).json({
  success: true,
  message: "Bookmarks retrieved successfully.",
  data: bookmarks,
});


} catch (error) {
console.error("Get bookmarks error:", error);


return res.status(500).json({
  success: false,
  message: "Failed to retrieve bookmarks.",
});


}
};

// DELETE /api/bookmarks/:questionId
// Remove a question from the logged-in user's bookmarks
export const deleteBookmark = async (req, res) => {
try {
const { questionId } = req.params;


if (!mongoose.Types.ObjectId.isValid(questionId)) {
  return res.status(400).json({
    success: false,
    message: "A valid question ID is required.",
  });
}

const bookmark = await Bookmark.findOneAndDelete({
  userId: req.user._id,
  questionId,
});

if (!bookmark) {
  return res.status(404).json({
    success: false,
    message: "Bookmark not found.",
  });
}

return res.status(200).json({
  success: true,
  message: "Bookmark removed successfully.",
});


} catch (error) {
console.error("Delete bookmark error:", error);


return res.status(500).json({
  success: false,
  message: "Failed to remove bookmark.",
});


}
};
