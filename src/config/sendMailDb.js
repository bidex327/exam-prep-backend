import dotenv from "dotenv";

dotenv.config();

export const sendMail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo email configuration is missing");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "ExamPrep NG",
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("Brevo email error:", response.status, errorDetails);
    throw new Error(`Failed to send email through Brevo (${response.status})`);
  }

  return response.json();
};