import User from "../models/User.js";

// GET /api/settings
// Retrieve the authenticated user's settings.
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "fullName emailOrPhone timezone location emailVerified"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Settings retrieved successfully.",
      data: {
        fullName: user.fullName,
        email: user.emailOrPhone,
        timezone: user.timezone || "Africa/Lagos",
        location: user.location || "",
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve settings.",
    });
  }
};

// PUT /api/settings
// Update permitted profile fields.
export const updateSettings = async (req, res) => {
  try {
    const { fullName, timezone, location } = req.body;

    const updates = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Full name must be a non-empty string.",
        });
      }

      updates.fullName = fullName.trim();
    }

    if (timezone !== undefined) {
      if (typeof timezone !== "string" || !timezone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Timezone must be a non-empty string.",
        });
      }

      updates.timezone = timezone.trim();
    }

    if (location !== undefined) {
      if (typeof location !== "string") {
        return res.status(400).json({
          success: false,
          message: "Location must be a string.",
        });
      }

      updates.location = location.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one supported field to update.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        returnDocument: after,
        runValidators: true,
      }
    ).select("fullName emailOrPhone timezone location emailVerified");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      data: {
        fullName: user.fullName,
        email: user.emailOrPhone,
        timezone: user.timezone || "Africa/Lagos",
        location: user.location || "",
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update settings.",
    });
  }
};