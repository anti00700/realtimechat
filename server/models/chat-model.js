const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    isGroupChat: { type: Boolean, default: false },
    groupName: {
      type: String,
      trim: true,
      required: function () {
        return this.isGroupChat;
      },
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message", // helpful for sidebar preview
    },
  },
  { timestamps: true }
);

// Index for queries like "find all chats where user is a participant"
chatSchema.index({ participants: 1 });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
