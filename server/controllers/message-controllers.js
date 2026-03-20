const Message = require("../models/message-model.js");
const Chat = require("../models/chat-model.js");
const cloudinary = require("../utils/cloudinary.js");
const TryCatch = require("../middlewares/TryCatch.js");

const sendMessage = TryCatch(async (req, res) => {
  const { chatId, content, type = "text", topicName, topicDescription } = req.body;
  const senderId = req.user._id;

  if (!chatId) {
    return res.status(400).json({ msg: "Chat ID required" });
  }

  if (type === "text" && !content?.trim()) {
    return res.status(400).json({ msg: "Message content required" });
  }

  if (type === "image" && !req.file) {
    return res.status(400).json({ msg: "Image file required" });
  }

  const chat = await Chat.findById(chatId);

  if (!chat || !chat.users.some(u => u.equals(senderId))) {
    return res.status(403).json({ msg: "You are not a member of this chat" });
  }

  let messageData = {
    senderId,
    chatId,
    type,
    timestamp: new Date(),
    readBy: [{ userId: senderId, timestamp: new Date() }]
  };

  if (type === "text") {
    messageData.content = content.trim();
  } else if (type === "image") {

    // Await the upload (Promise wraps callback)
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `chat_images/${chatId}`, resource_type: "image" },
        (error, result) => {
          if (error) {
            console.error("Upload error:", error); // Debug error
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file.buffer); // Buffer from memoryStorage
    });

    try {
      const result = await uploadPromise; // Wait here - content set after this
      messageData.content = result.secure_url;
      messageData.meta = {
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      };
      console.log("Content set for image:", messageData.content); // Debug
    } catch (error) {
      console.error("Full upload error:", error);
      return res.status(500).json({ msg: "Image upload failed: " + error.message });
    }
  } else if (type === "topic") {
    if (!topicName || !topicDescription) {
      return res.status(400).json({ msg: "Topic name and description required" });
    }
    const topic = chat.topics.find(t => t.name === topicName || t._id.toString() === topicName);
    if (!topic) {
      return res.status(400).json({ msg: "Topic not found in chat" });
    }
    messageData.topic = topic._id;
    messageData.description = topicDescription.trim();
  }

  // Create message (content is now set - validation passes)
  let message = await Message.create(messageData);
  message = await message.populate("senderId", "username displayName profilePic");

  await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

  if (req.io) {
    req.io.to(chatId).emit("newMessage", message);
  }

  res.status(201).json(message);
});

/**
 * Get all messages in a chat
 */
const getMessages = TryCatch(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!chatId) {
    return res.status(400).json({ msg: " chat ID required" });
  }

  const chat = await Chat.findById(chatId);

  if (!chat || !chat.users.some(u => u.equals(userId))) {
    return res.status(403).json({ msg: " you are not authorized of this chat" });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({ chatId })
    .populate("senderId", "username displayName profilePic") // Sender details
    .populate("readBy.userId", "username") // Who read it (for unread status)
    .sort({ timestamp: -1 }) // Newest first
    .limit(parseInt(limit))
    .skip(skip);

  // Reverse for oldest first (chronological order)
  messages.reverse();

  // Optional: Count total for pagination
  const total = await Message.countDocuments({ chatId });

  res.status(200).json({
    message: "Messages fetched successfully",
    messages,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
});

const markAsRead = TryCatch(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  if (!chatId) {
    return res.status(400).json({ msg: "Chat ID required" });
  }

  // Verify user is in chat
  const chat = await Chat.findById(chatId);
  if (!chat || !chat.users.some(u => u.equals(userId))) {
    return res.status(403).json({ msg: "Not authorized for this chat" });
  }

  // Find unread messages for this user in the chat
  const unreadMessages = await Message.find({
    chatId,
    'readBy.userId': { $ne: userId } // Messages not read by this user
  });

  if (unreadMessages.length === 0) {
    return res.status(200).json({ message: "No new messages to mark as read" });
  }

  // Update all unread messages to mark as read by this user
  const updateResult = await Message.updateMany(
    {
      chatId,
      'readBy.userId': { $ne: userId }
    },
    {
      $addToSet: { readBy: { userId, timestamp: new Date() } }
    }
  );

  // Reset unread count for this user in chat
  await Chat.findOneAndUpdate(
    { _id: chatId, 'unreadCounts.userId': userId },
    { $set: { 'unreadCounts.$.count': 0 } },
    { upsert: true }
  );

  // Emit to sender(s) for blue ticks (all other users in chat)
  if (req.io) {
    unreadMessages.forEach(msg => {
      req.io.to(chatId).emit("messagesRead", {
        messageIds: [msg._id],
        readBy: userId
      });
    });
  }

  res.status(200).json({
    message: "Messages marked as read",
    updatedCount: updateResult.modifiedCount
  });
});


module.exports = { sendMessage, getMessages, markAsRead };
