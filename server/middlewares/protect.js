const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const TryCatch = require("./TryCatch");

const protect = async (req, res, next) => {
  const token = req.cookies.jtoken;


  if (!token) {
    return res.status(401).json({ msg: "Not authorized, no token" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.userId).select("-password");

  if (!req.user) {
    return res.status(401).json({ msg: "Not authorized, user not found" });
  }

  next();
};

module.exports = protect;