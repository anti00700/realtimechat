const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional for group chats
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId, // Changed to ObjectId
    ref: "Chat", // Reference a Chat model
    required: true,
  },
  content: {
    type: String,
    trim: true,
    required: function () {
      return this.type !== "topic"; // Required unless topic
    },
  },
  type: {
    type: String,
    enum: ["text", "image", "topic"],
    default: "text",
  },
  topic: {
    type: String,
    trim: true,
    required: function () {
      return this.type === "topic";
    },
  },
  description: {
    type: String,
    trim: true,
    required: function () {
      return this.type === "topic";
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
messageSchema.index({ chatId: 1, timestamp: -1 }); // Optimize message queries
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;