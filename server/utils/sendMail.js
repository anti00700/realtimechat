const Brevo = require("@getbrevo/brevo");

const sendMail = async (email, subject, data) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();

  apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: "Batchit",
    email: process.env.BREVO_USER,
  };

  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = subject;

  sendSmtpEmail.htmlContent = `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 480px; margin: 40px auto; background-color: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; }
    h1 { color: #111; font-size: 22px; margin-bottom: 8px; }
    p { color: #666; font-size: 14px; margin-bottom: 24px; }
    .otp { font-size: 42px; color: #111; font-weight: 800; letter-spacing: 8px; margin: 24px 0; }
    .footer { font-size: 12px; color: #999; margin-top: 24px; }
  </style></head><body>
  <div class="container">
    <h1>Verify your email</h1>
    <p>Hello ${data.username}, enter this code to complete your Batchit registration.</p>
    <div class="otp">${data.otp}</div>
    <p>This code expires in 10 minutes.</p>
    <div class="footer">If you didn't request this, ignore this email.</div>
  </div></body></html>`;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = sendMail;