const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for group chats
    },
    content: {
      type: String,
      trim: true,
      required: function () {
        return this.type !== "topic"; // Required unless type is topic
      },
    },
    type: {
      type: String,
      enum: ["text", "image", "topic"],
      default: "text",
    },
    chatId: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: function () {
        return this.type === "topic"; // Required for topic messages
      },
    },
    description: {
      type: String,
      trim: true,
      required: function () {
        return this.type === "topic"; // Required for topic messages
      },
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;