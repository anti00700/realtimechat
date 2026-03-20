const jwt = require("jsonwebtoken");

const generateToken = (userId, res) => {

  const token = jwt.sign({userId}, process.env.JWT_SECRET, {
    expiresIn: "7d" // Token will expire in 7 days
  })

  res.cookie("jtoken",token, {
    httpOnly: true,
    sameSite: "none",    // ← allows cross-site
    secure: true,        // ← required when sameSite is "none"
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
}

module.exports = generateToken;