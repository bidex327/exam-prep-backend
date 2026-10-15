import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

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
  profilePicturePublicId: req.file.filename,
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



// DELETE /api/settings/profile-picture
export const removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // No picture to remove.
    if (!user.profilePicture) {
      return res.status(200).json({
        success: true,
        message: "No profile picture to remove.",
        data: { profilePicture: "" },
      });
    }

    // Use the saved public ID when available.
    let publicId = user.profilePicturePublicId;

    // Support pictures uploaded before the public ID field existed.
    if (!publicId) {
      try {
        const pathname = new URL(user.profilePicture).pathname;
        const uploadIndex = pathname.indexOf("/upload/");

        if (uploadIndex !== -1) {
          const parts = pathname
            .slice(uploadIndex + "/upload/".length)
            .split("/");

          const versionIndex = parts.findIndex((part) =>
            /^v\d+$/.test(part)
          );

          if (versionIndex !== -1) {
            publicId = parts
              .slice(versionIndex + 1)
              .join("/")
              .replace(/\.[^/.]+$/, "");
          }
        }
      } catch {
        publicId = "";
      }
    }

    // Never clear the database if we cannot identify the Cloudinary image.
    if (!publicId) {
      return res.status(500).json({
        success: false,
        message:
          "Could not identify the stored profile picture. Please contact support.",
      });
    }

    // Delete the image from Cloudinary first.
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (!["ok", "not found"].includes(result.result)) {
      return res.status(502).json({
        success: false,
        message: "Could not remove the profile picture from storage.",
      });
    }

    // Clear the image information in MongoDB.
    user.profilePicture = "";
    user.profilePicturePublicId = "";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture removed successfully.",
      data: {
        profilePicture: "",
      },
    });
  } catch (error) {
    console.error("Profile picture removal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove profile picture.",
    });
  }
};
