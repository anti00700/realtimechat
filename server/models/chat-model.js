const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, trim: true },
  isGroup: { type: Boolean, default: false },
  groupDescription: { type: String, trim: true, default: "" },

  // Participants
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],

  // Administration
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  adminOnly: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Messaging Features
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],

  // Topic Bubbles
  topics: [{
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  topicBubblesEnabled: { type: Boolean, default: false },

  // User-specific States
  archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  unreadCounts: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    count: { type: Number, default: 0 }
  }],
  // Add group icon
  groupIcon: { type: String }, // Cloudinary URL for group photo

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
chatSchema.index({ users: 1 });
chatSchema.index({ isGroup: 1 });
chatSchema.index({ "topics.name": "text" });
chatSchema.index({ 'unreadCounts.userId': 1 });

module.exports = mongoose.model("Chat", chatSchema);
