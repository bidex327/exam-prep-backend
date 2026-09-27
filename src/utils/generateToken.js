
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (userId) => {
  try {
    if (!userId) {
      throw new Error("User id is required");
    }

    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "2d",
      }
    );

    return token;
  } catch (error) {
    console.error(`Error generating token: ${error.message}`);
  }
};

export default generateToken;
