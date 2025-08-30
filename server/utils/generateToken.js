const jwt = require("jsonwebtoken");

const generateToken = (userId, res) => {

  const token = jwt.sign({userId}, process.env.JWT_SECRET, {
    expiresIn: "7d" // Token will expire in 7 days
  })

  res.cookie("jtoken",token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie will expire in 7 days in MS
    httpOnly: true,
    sameSite: "strict", // Helps prevent CSRF attacks
    secure: process.env.NODE_ENV != "devlopment" // Use secure cookies in production
  });
  return token;
}

module.exports = generateToken;