const Chat = require("../models/chat-model");
const User = require("../models/user-model");
const TryCatch = require("../middlewares/TryCatch");

/**
 * Create or get one-on-one chat
 * - Also ensures both users are added to each other's contacts
 */
const createOrGetChat = TryCatch(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  if (userId === currentUserId.toString()) {
    return res.status(400).json({ msg: "You cannot chat with yourself" });
  }

  // 1. Check if chat already exists
  let chat = await Chat.findOne({
    isGroupChat: false,
    participants: { $all: [currentUserId, userId] },
  }).populate("participants", "username displayName profilePic");

  // 2. If not, create new chat
  if (!chat) {
    chat = await Chat.create({
      participants: [currentUserId, userId],
      isGroupChat: false,
    });

    chat = await chat.populate("participants", "username displayName profilePic");

    // 🔥 Emit "newChat" event to both users
    req.io.to(currentUserId.toString()).emit("newChat", chat);
    req.io.to(userId).emit("newChat", chat);

    // 3. Add to each other’s contacts (WhatsApp-like consistency)
    const currentUser = await User.findById(currentUserId);
    const otherUser = await User.findById(userId);

    if (!currentUser.contacts.some(c => c.user.toString() === userId)) {
      currentUser.contacts.push({ user: userId, chatId: chat._id });
      await currentUser.save();
    }

    if (!otherUser.contacts.some(c => c.user.toString() === currentUserId)) {
      otherUser.contacts.push({ user: currentUserId, chatId: chat._id });
      await otherUser.save();
    }
  }

  res.status(200).json(chat);
});

/**
 * Get all chats for logged-in user
 */
const getAllChats = TryCatch(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({ participants: userId })
    .populate("participants", "username displayName profilePic")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  res.status(200).json(chats);
});

/**
 * Get chat by ID
 */
const getChatById = TryCatch(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId)
    .populate("participants", "username displayName profilePic")
    .populate("lastMessage");

  if (!chat) return res.status(404).json({ msg: "Chat not found" });

  res.status(200).json(chat);
});

/**
 * Create group chat
 */
const createGroupChat = TryCatch(async (req, res) => {
  const { name, participants } = req.body;
  const currentUserId = req.user._id;

  if (!name || !participants || participants.length < 2) {
    return res.status(400).json({ msg: "Group needs at least 3 members" });
  }

  let groupChat = await Chat.create({
    participants: [...participants, currentUserId],
    isGroupChat: true,
    groupName: name,
  });

  groupChat = await groupChat.populate("participants", "username displayName profilePic");

  // 🔥 Emit "newChat" to all members
  [...participants, currentUserId].forEach((id) => {
    req.io.to(id.toString()).emit("newChat", groupChat);
  });

  res.status(201).json(groupChat);
});

module.exports = {
  createOrGetChat,
  getAllChats,
  getChatById,
  createGroupChat,
};
