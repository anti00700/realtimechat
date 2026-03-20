const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    contacts: [{
      chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
      addedAt: { type: Date, default: Date.now }
    }],
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for faster username searches
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
