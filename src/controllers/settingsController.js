import User from "../models/User.js";

// GET /api/settings
// Retrieve the authenticated user's settings.
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
       "fullName emailOrPhone profilePicture timezone location emailVerified createdAt"
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
  profilePicture: user.profilePicture || "",
  timezone: user.timezone || "Africa/Lagos",
  location: user.location || "",
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
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
    const { timezone, location } = req.body;

    const updates = {};
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
    returnDocument: "after",
    runValidators: true,
  }
).select("fullName emailOrPhone profilePicture timezone location emailVerified createdAt");

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
        profilePicture: user.profilePicture || "",
       createdAt: user.createdAt,
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


// POST /api/settings/profile-picture
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile picture to upload.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          profilePicture: req.file.path,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select(
      "fullName emailOrPhone profilePicture timezone location emailVerified createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully.",
      data: {
        profilePicture: user.profilePicture,
        fullName: user.fullName,
        email: user.emailOrPhone,
        timezone: user.timezone || "Africa/Lagos",
        location: user.location || "",
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile picture.",
    });
  }
};
