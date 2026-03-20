// =============================================================================
// controllers/ai-controller.js
//
// WHAT THIS FILE DOES:
// 1. Receives a message from the frontend (the user's text + chatId)
// 2. Fetches the last 10 messages from that chat for context
// 3. Formats them into the shape Gemini expects
// 4. Calls the Gemini API
// 5. Saves the AI response as a real Message in MongoDB
//    (senderId = the AI bot user we created)
// 6. Emits the saved message via Socket.io so it appears in real-time
// 7. Returns the saved message to the frontend
// =============================================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");
// The official Google Generative AI SDK.
// Installed via: npm install @google/generative-ai
// GoogleGenerativeAI is the main class — we initialize it with our API key.

const Message = require("../models/message-model");
const Chat = require("../models/chat-model");
const User = require("../models/user-model");
const TryCatch = require("../middlewares/TryCatch");

// ─── INITIALIZE GEMINI ────────────────────────────────────────────────────────
// We initialize the client ONCE at the module level, not inside the function.
// WHY: Creating the client is cheap, but it's wasteful to recreate it on
// every single request. Module-level initialization happens once when the
// server starts and is reused for every request after that.

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// process.env.GEMINI_API_KEY reads from your server's .env file.
// Never hardcode API keys in source code — they would be visible in git history.

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  // gemini-1.5-flash: fast, free tier, great for chat.
  // Other options: "gemini-1.5-pro" (smarter, slower, has usage limits)

  systemInstruction: `You are Batchit AI, a helpful and friendly assistant 
built into the Batchit messaging app. You help users with questions, 
tasks, creative writing, and general conversation. Keep responses 
concise and conversational — this is a chat interface, not a document editor. 
Do not use excessive markdown formatting. Be warm, direct, and useful.`,
  // systemInstruction tells Gemini WHO it is and HOW to behave.
  // This runs before every conversation — it sets the AI's personality.
  // Keeping responses concise is important for a chat UI.
  // We explicitly say no excessive markdown because chat bubbles
  // render plain text — **bold** and # headers would look ugly.
});


// =============================================================================
// CONTROLLER: aiChat
// Route: POST /api/ai/chat
// Protected: yes (protect middleware reads jtoken cookie)
// Body: { chatId, message }
// =============================================================================

const aiChat = TryCatch(async (req, res) => {
  const { chatId, message } = req.body;
  const userId = req.user._id;

  // ── VALIDATION ──────────────────────────────────────────────────────────────

  if (!chatId || !message?.trim()) {
    return res.status(400).json({ msg: "chatId and message are required" });
  }

  // ── VERIFY USER IS IN THIS CHAT ──────────────────────────────────────────────

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.users.some((u) => u.equals(userId))) {
    return res.status(403).json({ msg: "Not authorized for this chat" });
  }
  // Same guard your other controllers use — don't skip this.
  // Without it, anyone with a valid cookie could get AI responses
  // for chats they're not part of.

  // ── FETCH CONVERSATION HISTORY FOR CONTEXT ───────────────────────────────────
  // We fetch the last 10 messages to give Gemini conversation memory.
  // This is what makes "multiply that by 3" work after "what's 2+2".

  const recentMessages = await Message.find({ chatId })
    .sort({ timestamp: -1 })
    // Sort newest first so .limit(10) gets the 10 most recent.
    .limit(10)
    .populate("senderId", "username displayName");
    // We need username to know if a message was from the AI bot or a human.

  // Reverse so messages are in chronological order (oldest first).
  // Gemini expects conversation history from oldest to newest.
  recentMessages.reverse();

  // ── FORMAT MESSAGES FOR GEMINI ────────────────────────────────────────────────
  // Gemini's chat API expects this exact shape:
  // [
  //   { role: "user",  parts: [{ text: "hello" }] },
  //   { role: "model", parts: [{ text: "hi there!" }] },
  //   { role: "user",  parts: [{ text: "how are you?" }] },
  // ]
  //
  // Rules:
  // - role must alternate: user, model, user, model...
  // - It CANNOT start with role: "model"
  // - Our AI bot's messages → role: "model"
  // - All human messages → role: "user"

  const AI_BOT_ID = process.env.AI_BOT_USER_ID;

  const formattedHistory = recentMessages
    .filter((msg) => msg.type === "text" && msg.content?.trim())
    // Only include text messages — skip images, topics, etc.
    // Also skip empty content to avoid Gemini API errors.
    .map((msg) => ({
      role: msg.senderId._id.toString() === AI_BOT_ID ? "model" : "user",
      // If the message was sent by the AI bot → role: "model"
      // If sent by any human → role: "user"
      // Note: in a group chat with multiple humans, they all become "user"
      // from Gemini's perspective. This is correct — Gemini only distinguishes
      // between itself (model) and everyone else (user).
      parts: [{ text: msg.content }],
    }));

  // Gemini will error if history starts with "model".
  // This can happen if the AI sent the first message somehow.
  // Safe guard: strip leading model messages.
  while (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
    formattedHistory.shift();
    // .shift() removes the first element of an array.
  }

  // ── CALL GEMINI API ───────────────────────────────────────────────────────────

  const chat_session = model.startChat({
    history: formattedHistory,
    // Pass the conversation history so Gemini has context.
    // The current message is sent separately via sendMessage() below —
    // it should NOT be in the history array.
  });

  const result = await chat_session.sendMessage(message.trim());
  // .sendMessage() sends the current user message to Gemini.
  // Gemini sees: [history...] + this new message → generates a response.

  const aiResponseText = result.response.text();
  // .text() extracts the plain text from Gemini's response object.
  // The response object has other fields (safety ratings, etc.) we don't need.

  if (!aiResponseText?.trim()) {
    return res.status(500).json({ msg: "AI returned an empty response" });
  }

  // ── SAVE AI RESPONSE AS A MESSAGE ─────────────────────────────────────────────
  // We save the AI response to MongoDB exactly like a normal message.
  // This means:
  //   - It appears in message history when the chat is reopened
  //   - It is fetched by GET /api/messages/:chatId like any other message
  //   - It has a real senderId (the bot user) so the frontend can identify it

  let savedMessage = await Message.create({
    senderId: AI_BOT_ID,
    chatId,
    content: aiResponseText.trim(),
    type: "text",
    timestamp: new Date(),
    readBy: [{ userId: AI_BOT_ID, timestamp: new Date() }],
  });

  // Populate senderId so the frontend receives the full sender object
  // (username, displayName, profilePic) — same shape as all other messages.
  savedMessage = await savedMessage.populate(
    "senderId",
    "username displayName profilePic"
  );

  // Update the chat's lastMessage so the sidebar preview shows the AI response.
  await Chat.findByIdAndUpdate(chatId, { lastMessage: savedMessage._id });

  // ── EMIT VIA SOCKET.IO ────────────────────────────────────────────────────────
  // This is the magic line. We emit "newMessage" to the chat room.
  // The frontend's existing socket listener in ChatWindow.tsx catches this
  // and calls dispatch(addMessage(message)) — the AI response appears
  // in the chat window in real-time, exactly like a human message.
  // Zero frontend changes needed for the real-time delivery.

  if (req.io) {
    req.io.to(chatId).emit("newMessage", savedMessage);
  }

  res.status(200).json({ message: savedMessage });
});

module.exports = { aiChat };