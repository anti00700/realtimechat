const jwt =  require("jsonwebtoken");

const generateOtpToken = (payload) => {
  const token = jwt.sign(payload, process.env.OTP_SECRET, {
    expiresIn: "5m"
  });
  return token;
};

module.exports = generateOtpToken;