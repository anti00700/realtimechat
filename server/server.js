require("dotenv").config()
const http = require("http");
const express = require("express");
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const authrouter = require("./router/auth-router");
const messageRouter = require("./router/message-router");
const chatRouter = require("./router/chat-router");
const userRouter = require("./router/user-router");
const aiRouter = require("./router/ai-router");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const connectDB = require("./utils/db");

const PORT = process.env.PORT || 5000;


const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  }
})

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
// Pass io to controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authrouter);
app.use("/api/messages", messageRouter);
app.use("/api/chat", chatRouter);
app.use("/api/users", userRouter);
app.use("/api/ai", aiRouter);


// --- Socket.IO Authentication ---
io.use((socket, next) => {
  try {
    const token = (() => {
  // Try auth object first (for future token-based clients)
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;

  // Parse jtoken cookie precisely from the cookie string
  const cookieStr = socket.handshake.headers.cookie || "";
  const match = cookieStr.match(/(?:^|;\s*)jtoken=([^;]+)/);
  return match ? match[1] : null;
})();
    if (!token) return next(new Error("Authentication error: No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { 
            id: decoded.userId,  // Map userId to id for consistency
      ...decoded 
      }; // { id, username, ... }
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Track online users
const onlineUsers = new Map();

// --- Socket.IO Events ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.user.id);

  // When user is ready -> join personal room
  socket.on("userConnected", () => {
  const userId = socket.user?.id;
  if (!userId) {
    console.log("User not authenticated on socket");
    return;
  }
  onlineUsers.set(socket.id, userId);
  socket.join(userId);
  io.emit("onlineUsers", Array.from(onlineUsers.values()));
  console.log(`User ${userId} connected`);
});

  // Join a chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.user.id} joined chat room: ${chatId}`);
  });

  // Send a message
  socket.on("sendMessage", async ({ chatId, content }) => {
  try {
    const senderId = socket.user?.id;
    
    if (!senderId) {
      return socket.emit("messageError", "Not authenticated");
    }
    if (!content?.trim()) {
      return socket.emit("validationError", "Message content required");
    }

    const Message = require("./models/message-model");
    const Chat = require("./models/chat-model");

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.users.some(u => u.toString() === senderId)) {
      return socket.emit("messageError", "Not a member of this chat");
    }

    let message = await Message.create({
      senderId,
      chatId,
      content: content.trim(),
      type: "text",
      timestamp: new Date(),
      readBy: [{ userId: senderId, timestamp: new Date() }]
    });

    message = await message.populate("senderId", "username displayName profilePic");
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    io.to(chatId).emit("newMessage", message);

  } catch (err) {
    console.error("Message save failed:", err);
    socket.emit("messageError", err.message);
  }
});

  // Disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
    console.log("Client disconnected:", socket.user.id);
  });
});


connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`)
  });
});