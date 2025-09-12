"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setMessages } from "../../redux/slices/chatSlice";
import api from "../../utils/api";

export default function ChatArea({ socket }) {
  const { activeChat, messages } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [newMsg, setNewMsg] = useState("");

  // ✅ Load messages for active chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      try {
        const res = await api.get(`/messages/${activeChat._id}`);
        dispatch(setMessages(res.data));
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    fetchMessages();
  }, [activeChat, dispatch]);

  // ✅ Listen for incoming socket messages
  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", (msg) => {
      if (msg.chat === activeChat?._id) {
        dispatch(addMessage(msg));
      }
    });
    return () => socket.off("newMessage");
  }, [socket, activeChat, dispatch]);

  // ✅ Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;

    try {
      const res = await api.post("/messages", {
        chatId: activeChat._id,
        content: newMsg,
      });
      dispatch(addMessage(res.data));
      socket.emit("sendMessage", res.data);
      setNewMsg("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (!activeChat)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat to start messaging
      </div>
    );

  const other = activeChat.participants.find((p) => p._id !== user._id);

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="p-3 border-b flex items-center">
        <img
          src={other?.profilePic || "/default.png"}
          alt="avatar"
          className="w-10 h-10 rounded-full mr-3"
        />
        <p className="font-semibold">{other?.displayName || other?.username}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m._id}
            className={`p-2 rounded max-w-xs ${
              m.sender === user._id
                ? "bg-green-200 ml-auto"
                : "bg-gray-200 mr-auto"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t flex">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message"
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          className="ml-2 bg-green-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
