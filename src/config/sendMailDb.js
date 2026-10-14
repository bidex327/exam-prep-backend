
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Temporary diagnostic: confirms whether Vercel has both variables.
console.log("Email environment check:", {
  EMAIL_USER_SET: Boolean(process.env.EMAIL_USER),
  EMAIL_PASS_SET: Boolean(process.env.EMAIL_PASS),
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,

  tls: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: false,
  },

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log("Email server is ready");
  })
  .catch((error) => {
    console.error("Email server error:", error.message);
  });

export const sendMail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email configuration is missing");
  }

  return transporter.sendMail({
    from: `"ExamPrep NG" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
