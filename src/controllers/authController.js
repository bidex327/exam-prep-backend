import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { fullName, emailOrPhone, password } = req.body;

    if (!fullName || !emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "fullName, emailOrPhone and password are required",
        data: {},
      });
    }

    const existingUser = await User.findOne({ emailOrPhone });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email or phone already exists",
        data: {},
      });
    }

    // password hashing happens automatically via the pre('save') hook on User.js
    const user = await User.create({ fullName, emailOrPhone, password });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          emailOrPhone: user.emailOrPhone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "emailOrPhone and password are required",
        data: {},
      });
    }

    // password has `select: false` in the schema, so it must be explicitly requested
    const user = await User.findOne({ emailOrPhone }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: {},
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: {},
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          emailOrPhone: user.emailOrPhone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: {},
    });
  }
};