import mongoose from "mongoose";

import Topic from "../models/Topic.js";
import Subject from "../models/Subject.js";

// ======================================================
// CREATE TOPIC
// ======================================================

export const createTopic = async (req, res) => {
  try {
    const { name, subjectId, icon } = req.body;

    if (!name || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "name and subjectId are required",
        data: {},
      });
    }

    // Validate subjectId format
    if (!mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subjectId",
        data: {},
      });
    }

    // Make sure the subject exists
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
        data: {},
      });
    }

    const topic = await Topic.create({
      name,
      subjectId,
      icon: icon || "",
    });

    return res.status(201).json({
      success: true,
      message: "Topic created successfully",
      data: topic,
    });
  } catch (error) {
    console.error("CREATE TOPIC ERROR:", error);

    // Handle duplicate topic name for same subject
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A topic with this name already exists for this subject",
        data: {},
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create topic",
      data: {},
    });
  }
};

// ======================================================
// GET ALL TOPICS
// ======================================================

export const getTopics = async (req, res) => {
  try {
    const { subjectId } = req.query;

    const match = {};

    if (subjectId) {
      if (!mongoose.isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId",
          data: {},
        });
      }

      match.subjectId = new mongoose.Types.ObjectId(subjectId);
    }

    const topics = await Topic.aggregate([
      // -----------------------------------------------
      // Filter topics
      // -----------------------------------------------
      {
        $match: match,
      },

      // -----------------------------------------------
      // Count questions belonging to each topic
      // -----------------------------------------------
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "topicId",
          as: "questions",
        },
      },

      // -----------------------------------------------
      // Return the information the frontend needs
      // -----------------------------------------------
      {
        $project: {
          _id: 0,
          topicId: "$_id",
          name: 1,
          icon: 1,
          subjectId: 1,
          questionCount: {
            $size: "$questions",
          },
        },
      },

      // -----------------------------------------------
      // Sort alphabetically
      // -----------------------------------------------
      {
        $sort: {
          name: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Topics fetched successfully",
      data: topics,
    });
  } catch (error) {
    console.error("GET TOPICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch topics",
      data: {},
    });
  }
};