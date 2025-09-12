const User = require("../models/user-model");
const Chat = require("../models/chat-model");
const TryCatch = require("../middlewares/TryCatch");
const cloudinary = require("../utils/cloudinary");

/**
 * Get logged-in user profile
 */
const me = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.status(200).json({ user });
});

/**
 * Update profile picture
 */
const updateProfilePic = TryCatch(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ msg: "No image uploaded" });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "profile_pics", public_id: `user_${user._id}`, overwrite: true },
      (error, result) => (error ? reject(error) : resolve(result))
    ).end(file.buffer);
  });

  user.profilePic = result.secure_url;
  await user.save();

  const { password: _, ...userData } = user.toObject();
  res.status(200).json({ msg: "Profile picture updated", user: userData });
});

/**
 * Update display name
 */
const updateProfile = TryCatch(async (req, res) => {
  const { displayName } = req.body;
  if (!displayName) return res.status(400).json({ msg: "Display name required" });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  user.displayName = displayName.trim();
  await user.save();

  const { password: _, ...userData } = user.toObject();
  res.status(200).json({ msg: "Profile updated", user: userData });
});

/**
 * Check username availability
 */
const checkUsername = TryCatch(async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });
  res.status(200).json({ available: !user });
});

/**
 * Get all contacts of logged-in user
 */
const getContacts = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("contacts.user", "username displayName profilePic")
    .select("contacts");

  res.status(200).json(user.contacts);
});

/**
 * Add a new contact
 */
const addContact = TryCatch(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  if (userId === currentUserId.toString()) {
    return res.status(400).json({ msg: "Cannot add yourself as a contact" });
  }

  const contactUser = await User.findById(userId);
  if (!contactUser) return res.status(404).json({ msg: "User not found" });

  const currentUser = await User.findById(currentUserId);
  if (currentUser.contacts.some((c) => c.user.toString() === userId)) {
    return res.status(400).json({ msg: "Contact already added" });
  }

  const chatId = [currentUserId, userId].sort().join("_");
  currentUser.contacts.push({ user: userId, chatId });
  await currentUser.save();

  res.status(200).json({ msg: "Contact added", chatId });
});

/**
 * Search contacts (sidebar) - only among chats user is in
 */
const searchContacts = TryCatch(async (req, res) => {
  const { query } = req.query;
  const userId = req.user._id;

  const chats = await Chat.find({ participants: userId })
    .populate("participants", "username displayName profilePic")
    .sort({ updatedAt: -1 });

  let users = [];
  chats.forEach((chat) => {
    chat.participants.forEach((u) => {
      if (u._id.toString() !== userId.toString()) {
        users.push({ ...u.toObject(), chatId: chat._id });
      }
    });
  });

  if (query && query.trim()) {
    const q = query.toLowerCase();
    users = users.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q))
    );
  }

  const uniqueUsers = [];
  const seen = new Set();
  users.forEach((u) => {
    if (!seen.has(u._id.toString())) {
      seen.add(u._id.toString());
      uniqueUsers.push(u);
    }
  });

  res.status(200).json(uniqueUsers);
});

/**
 * Global search for new chat creation
 */
const searchUsers = TryCatch(async (req, res) => {
  const { query } = req.query;
  if (!query || !query.trim()) return res.status(400).json([]);

  const q = query.trim().toLowerCase();
  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { displayName: { $regex: q, $options: "i" } },
    ],
  }).select("username displayName profilePic");

  res.status(200).json(users);
});

module.exports = {
  me,
  updateProfilePic,
  updateProfile,
  checkUsername,
  getContacts,
  addContact,
  searchContacts,
  searchUsers,
};
