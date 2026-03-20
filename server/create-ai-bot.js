// create-ai-bot.js — run once then delete
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user-model");

async function createBot() {
  // Handles the most common MongoDB env variable names.
  // Check your .env and make sure one of these matches exactly.
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    console.error("❌ Could not find MongoDB URI in .env");
    console.error("Check your .env file and look for your MongoDB connection string.");
    console.error("It starts with: mongodb+srv://...");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.");

  const existing = await User.findOne({ username: "batchit_ai" });
  if (existing) {
    console.log("✅ Bot already exists. _id:", existing._id.toString());
    console.log("Copy this into your .env as AI_BOT_USER_ID =", existing._id.toString());
    process.exit(0);
  }

  const bot = await User.create({
    username: "batchit_ai",
    email: "ai@batchit.internal",
    password: await bcrypt.hash("batchit-ai-no-login-9x7z", 10),
    displayName: "Batchit AI",
    profilePic: "",
  });

  console.log("✅ Bot created successfully!");
  console.log("Copy this _id into your server .env as AI_BOT_USER_ID:");
  console.log(bot._id.toString());
  console.log("\nAlso copy it into your frontend .env.local as NEXT_PUBLIC_AI_BOT_USER_ID:");
  console.log(bot._id.toString());
  process.exit(0);
}

createBot().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});