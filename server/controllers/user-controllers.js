const User = require("../models/user-model");
const TryCatch = require("../middlewares/TryCatch");

const checkUsername = TryCatch(async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });
  res.status(200).json({ available: !user });
});

const searchUsers = TryCatch(async (req, res) => {
  const { query } = req.query; // Ensure this matches Postman 'key'
  
  if (!query) {
    return res.status(200).json([]);
  }

  const users = await User.find({
    username: { $regex: query, $options: "i" }, // "i" = case-insensitive
  }).select("username displayName profilePic");

  res.status(200).json(users);
});

module.exports = {
  checkUsername,
  searchUsers};