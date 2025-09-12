const Message = require("../models/message-model");
const Chat = require("../models/chat-model");
const TryCatch = require("../middlewares/TryCatch");

/**
 * Send a message (real-time + save to DB)
 */
const sendMessage = TryCatch(async (req, res) => {
  const { chatId, content } = req.body;
  const senderId = req.user._id;

  if (!chatId || !content?.trim()) {
    return res.status(400).json({ msg: "Chat ID and content required" });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ msg: "Chat not found" });
  }

  // Save message
  let message = await Message.create({
    senderId,
    chatId,
    content: content.trim(),
    type: "text",
  });

  // Update lastMessage in chat
  chat.lastMessage = message._id;
  await chat.save();

  // Populate sender for frontend
  message = await message.populate("senderId", "username displayName profilePic");

  // Emit via Socket.IO
  req.io.to(chatId).emit("newMessage", message);

  res.status(201).json(message);
});

/**
 * Get all messages in a chat
 */
const getMessages = TryCatch(async (req, res) => {
  const { chatId } = req.params;

  const messages = await Message.find({ chatId })
    .populate("senderId", "username displayName profilePic")
    .sort("timestamp");

  res.status(200).json(messages);
});

module.exports = { sendMessage, getMessages };
