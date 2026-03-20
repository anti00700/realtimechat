const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Only for direct 1-on-1 chats
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  content: {
    type: String,
    trim: true,
    required: function () {
      return this.type !== "topic"; // text/image/video/file must have content
    },
  },
  type: {
    type: String,
    enum: ["text", "image", "video", "file", "topic"],
    default: "text"
  },

  // 🔹 Reference topic subdocument by ID
  topic: {
    type: mongoose.Schema.Types.ObjectId
  },

  description: {
    type: String,
    trim: true,
    required: function () {
      return this.type === "topic"; // Topic messages need description
    },
  },

  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
