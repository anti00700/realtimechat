// =============================================================================
// controllers/ai-controller.js
// =============================================================================
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../models/message-model");
const Chat = require("../models/chat-model");
const TryCatch = require("../middlewares/TryCatch");

// ─── INITIALIZE GEMINI (Module Level) ─────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = "gemini-1.5-flash";

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: `You are Batchit AI, a helpful and friendly assistant built into the Batchit messaging app. You help users with questions, tasks, creative writing, and general conversation. Keep responses concise and conversational — this is a chat interface, not a document editor. Do not use excessive markdown formatting. Be warm, direct, and useful.`,
});

// ─── CONTROLLER: aiChat ───────────────────────────────────────────────────────
const aiChat = TryCatch(async (req, res) => {
  const { chatId, message } = req.body;
  const userId = req.user._id;

  // ── VALIDATION ─────────────────────────────────────────────────────────────
  if (!chatId || !message?.trim()) {
    return res.status(400).json({ msg: "chatId and message are required" });
  }

  // ── AUTHORIZATION ──────────────────────────────────────────────────────────
  const chat = await Chat.findById(chatId);
  if (!chat || !chat.users.some((u) => u.equals(userId))) {
    return res.status(403).json({ msg: "Not authorized for this chat" });
  }

  // ── FETCH CONTEXT HISTORY ──────────────────────────────────────────────────
  const recentMessages = await Message.find({ chatId })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate("senderId", "username displayName");

  recentMessages.reverse(); // Chronological order (oldest → newest)

  const AI_BOT_ID = process.env.AI_BOT_USER_ID;

  // ── FORMAT & SANITIZE HISTORY FOR GEMINI ───────────────────────────────────
  // 1. Filter valid text messages only
  const validMessages = recentMessages.filter(
    (msg) => msg.type === "text" && msg.content?.trim()
  );

  // 2. Map to Gemini format
  let formattedHistory = validMessages.map((msg) => ({
    role: msg.senderId._id.toString() === AI_BOT_ID ? "model" : "user",
    parts: [{ text: msg.content.trim() }],
  }));

  // 3. ENSURE STRICT ALTERNATION (user → model → user → model)
  // Gemini API throws 400 if two consecutive messages have the same role.
  const alternatingHistory = [];
  let lastRole = null;

  for (const msg of formattedHistory) {
    if (msg.role !== lastRole) {
      alternatingHistory.push(msg);
      lastRole = msg.role;
    } else {
      // Merge consecutive messages from same role
      const lastMsg = alternatingHistory[alternatingHistory.length - 1];
      lastMsg.parts[0].text += `\n${msg.parts[0].text}`;
    }
  }

  // 4. History MUST start with 'user'. Strip leading 'model' if present.
  if (alternatingHistory.length > 0 && alternatingHistory[0].role === "model") {
    alternatingHistory.shift();
  }

  // 5. Limit to last 10 exchanges to stay within token limits
  const finalHistory = alternatingHistory.slice(-10);

  // ── CALL GEMINI API ────────────────────────────────────────────────────────
  try {
    const chat_session = model.startChat({ history: finalHistory });
    const result = await chat_session.sendMessage(message.trim());
    const aiResponseText = result.response.text();

    if (!aiResponseText?.trim()) {
      return res.status(500).json({ msg: "AI returned an empty response" });
    }

    // ── SAVE AI RESPONSE AS A MESSAGE ────────────────────────────────────────
    let savedMessage = await Message.create({
      senderId: AI_BOT_ID,
      chatId,
      content: aiResponseText.trim(),
      type: "text",
      timestamp: new Date(),
      readBy: [{ userId: AI_BOT_ID, timestamp: new Date() }],
    });

    savedMessage = await savedMessage.populate(
      "senderId",
      "username displayName profilePic"
    );

    await Chat.findByIdAndUpdate(chatId, { lastMessage: savedMessage._id });

    // ── EMIT VIA SOCKET.IO ───────────────────────────────────────────────────
    if (req.io) {
      req.io.to(chatId).emit("newMessage", savedMessage);
    }

    res.status(200).json({ message: savedMessage });

  } catch (error) {
    // 🔍 STRUCTURED LOGGING FOR GEMINI API FAILURES
    console.error("=== GEMINI API ERROR ===");
    console.error("Model:", MODEL_NAME);
    console.error("Status/Code:", error.status || error.code || "N/A");
    console.error("Message:", error.message);
    console.error("Details:", JSON.stringify(error.details || error.response?.data || error, null, 2));
    console.error("========================");
    
    return res.status(500).json({ 
      msg: "AI service temporarily unavailable. Check server logs for details." 
    });
  }
});

module.exports = { aiChat };