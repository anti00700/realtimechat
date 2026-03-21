const nodemailer = require("nodemailer");

const sendMail = async (email, subject, data) => {
  const transport = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

  const html = `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #0c0b0f; /* Pop Violet Lime: deep background */
    }
    .container {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    h1 {
      color: #8b5cf6; /* Pop violet */
    }
    p {
      margin-bottom: 20px;
      color: #6b7280; /* Muted gray for readability on white */
    }
    .otp {
      font-size: 36px;
      color: #bef264; /* Lime pop for the OTP */
      margin-bottom: 30px;
      font-weight: 700;
      letter-spacing: 1px;
    }
  </style></head><body>
  <div class="container">
    <h1>OTP Verification</h1>
    <p>Hello ${data.username} your (One-Time Password) for your account verification is.</p>
    <p class="otp">${data.otp}</p>
  </div></body></html>`;

  await transport.sendMail({
    from: process.env.BREVO_USER,
    to: email,
    subject,
    html,
  })
}

module.exports = sendMail;