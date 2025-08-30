require("dotenv").config()
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const router = require("./router/auth-router");
const messageRouter = require("./router/message-router");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const connectDB = require("./utils/db");


const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", router);
app.use("/api/messages", messageRouter);

//socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)


// join a chat room
socket.on("joinChat", (chatId) => {
  socket.join(chatId);
  console.log(`user ${socket.id} joined chat room: ${chatId}`);
});

//Handle sending messages
socket.on("sendMessage", (messageData) => {
  const {chatId, message } = messageData;

  //Emit to all users in the same room
  io.to(chatId).emit("newMessage", {
      _id: Date.now(), // temp ID, replace with DB _id
      sender: { _id: socket.id, username: "TempUser" }, // replace with real user
      content: message,
    });
  });

//handle dsiconnect
socket.on("disconnect", () => {
  console.log("client disconnected", socket.id)
});
})

const PORT = 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`)
  });
});