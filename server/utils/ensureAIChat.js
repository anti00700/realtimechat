const Chat = require("../models/chat-model");

const ensureAIChat = async (userId) => {
  const aiBotId = process.env.AI_BOT_USER_ID;
  if (!aiBotId) return;

  const existing = await Chat.findOne({
    isGroup: false,
    users: { $all: [userId, aiBotId], $size: 2 },
  });

  if (!existing) {
    await Chat.create({
      isGroup: false,
      users: [userId, aiBotId],
      createdBy: userId,
    });
  }
};

module.exports = ensureAIChat;