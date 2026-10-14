const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

transporter.verify()
  .then(() => {
    console.log("SMTP connection verified successfully");
  })
  .catch((error) => {
    console.error("SMTP diagnostic failed:", error.message);
    console.error("Error code:", error.code);
    console.error("Command:", error.command);
  });