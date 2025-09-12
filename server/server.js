require("dotenv").config()
const http = require("http");
const express = require("express");
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const authrouter = require("./router/auth-router");
const chatRouter = require("./router/chat-router");
const messageRouter = require("./router/message-router");
const userRoutes = require("./router/user-router");
const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { sendMessage } = require("./controllers/message-controllers");
const cookieParser = require("cookie-parser");
const connectDB = require("./utils/db");


const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
// Pass io to controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authrouter);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRouter);
app.use("/api/chats", chatRouter);

// --- Socket.IO Authentication ---
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.cookie?.split("token=")[1];

    if (!token) return next(new Error("Authentication error: No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, username, ... }
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
  socket.on("userConnected", (userId) => {
    if (userId !== socket.user.id) return; // prevent spoofing
    onlineUsers.set(socket.id, userId);

    socket.join(userId); // personal room
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
      // Input validation
      if (!content || typeof content !== "string" || !content.trim()) {
        return socket.emit("validationError", "Invalid message content");
      }
      if (content.length > 1000) {
        return socket.emit("validationError", "Message too long (max 1000 chars)");
      }

      // Save message with controller
      const savedMessage = await sendMessage({
        body: { chatId, content },
        user: socket.user,
        io,
      });

      // Broadcast to chat room
      io.to(chatId).emit("newMessage", savedMessage);
    } catch (err) {
      console.error("Message save failed:", err);
      socket.emit("messageError", "Failed to save message");
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
    console.log("Client disconnected:", socket.user.id);
  });
});

const PORT = 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`)
  });
});