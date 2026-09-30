import Topic from "../models/Topic.js";

// Create a new topic
export const createTopic = async (req, res) => {
  try {
    const { name, subjectId } = req.body;

    const topic = await Topic.create({
      name,
      subjectId
    });

    return res.status(201).json({
      success: true,
      message: "Topic created successfully",
      data: topic
    });
  } catch (error) {
    console.error("Error creating topic:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create topic",
      data: {}
    });
  }
};

// Get all topics
export const getTopics = async (req, res) => {
  try {
    const topics = await Topic.find();

    return res.status(200).json({
      success: true,
      message: "Topics fetched successfully",
      data: topics
    });
  } catch (error) {
    console.error("Error fetching topics:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch topics",
      data: {}
    });
  }
};