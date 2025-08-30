const Message = require("../models/message-model");
const TryCatch = require("../middlewares/TryCatch");
const User = require("../models/user-model");


const sendMessage = TryCatch(async (req, res) => {
    const { content, receiverId, chatId, type, topic, description } = req.body;
    const senderId = req.user._id;

    if (type === "topic" && (!topic || !description)) {
        return res.status(400).json({ msg: "Topic and description required" })
    }
    if (type !== "topic" && !content) {
        return res.status(400).json({ msg: "Content required" });
    }

    const message = await Message.create({
        sender: senderId,
        receiver: receiverId || null,
        content,
        type: type || "text",
        chatId,
        topic: type === "topic" ? topic : undefined,
        description: type === "topic" ? description : undefined,
    });

    const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username displayName profilePic")
    .populate("receiver", "username displayName profilePic");
    
    req.io.to(chatId).emit("newMessage", populatedMessage);
    res.status(201).json({ msg: "Message sent", message: populatedMessage})
});

const getMessages = TryCatch(async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chatId })
    .populate("sender", "username displayName profilePic")
    .populate("receiver", "username displayName profilePic");
  res.status(200).json(messages);
});


module.exports = {sendMessage, getMessages};