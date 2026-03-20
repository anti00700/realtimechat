const Chat = require("../models/chat-model.js");
const TryCatch = require("../middlewares/TryCatch.js");
const User = require("../models/user-model.js");

const createOrGetOneOnOneChat = TryCatch(async (req, res) => {
  const userId = req.user._id;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    res.status(400).json({ message: " other userid is required" });
    return;
  };

  const existingChat = await Chat.findOne({
    isGroup: false,
    users: { $all: [userId, otherUserId], $size: 2 }
  }).populate("users", "username profilePic");

  if (existingChat) {
    res.status(200).json(existingChat);
    return;
  }


  const newChat = await Chat.create({
    isGroup: false,
    users: [userId, otherUserId],
    createdBy: userId,
  });

  // Update contacts only for the user who created the chat
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { contacts: { user: otherUserId, chatId: newChat._id } } } // Real chat._id
  );


  res.status(201).json({
    message: "New chat created",
    chatId: newChat._id,
    isNew: true
  });
});


const getChats = TryCatch(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({ users: userId })
    .populate("users", "username profilePic displayName")
    .populate("lastMessage", "content senderId timestamp type")
    .populate("topics.createdBy", "username")
    .populate("admins", "username")
    .sort("-updatedAt")
    .limit(50);

  const chatsWithUnread = chats.map(chat => {
    const userUnread = chat.unreadCounts.find(uc => uc.userId.toString() === userId.toString());
    const unreadCount = userUnread ? userUnread.count : 0;

    return {
      ...chat.toObject(),
      unreadCount
    };
  });

  res.status(200).json({
    message: "Chats fetched successfully",
    chats: chatsWithUnread,
    count: chatsWithUnread.length
  });

});

module.exports = { createOrGetOneOnOneChat, getChats };