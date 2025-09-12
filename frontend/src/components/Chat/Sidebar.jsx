"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setContacts, setActiveChat } from "../../redux/slices/chatSlice";
import api from "../../utils/api";
import { FiPlus } from "react-icons/fi";

export default function Sidebar() {
  const dispatch = useDispatch();
  const { contacts, activeChat } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);

  // ✅ Load chats initially
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get("/chats");
        // sort chats by latest message
        const sorted = res.data.sort(
          (a, b) =>
            new Date(b.lastMessage?.createdAt || 0) -
            new Date(a.lastMessage?.createdAt || 0)
        );
        dispatch(setContacts(sorted));
      } catch (err) {
        console.error("Failed to fetch chats", err);
      }
    };
    fetchChats();
  }, [dispatch]);

  // ✅ Search users
  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (e.target.value.trim() === "") {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search-users?query=${e.target.value}`);
      // exclude self
      const filtered = res.data.filter((u) => u._id !== user?._id);
      setSearchResults(filtered);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  // ✅ Start new chat
  const handleNewChat = async (userId) => {
    try {
      const res = await api.post("/chats", { userId });
      // prepend new chat on top
      dispatch(setContacts([res.data, ...contacts]));
      dispatch(setActiveChat(res.data));
      setShowNewChat(false);
      setSearch("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  };

  return (
    <div className="w-1/3 h-screen border-r border-gray-300 flex flex-col relative">
      {/* 🔍 Search Bar */}
      <div className="p-2">
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search or start new chat"
          className="w-full p-2 border rounded"
        />
        {showNewChat && searchResults.length > 0 && (
          <div className="bg-white border mt-1 rounded shadow max-h-60 overflow-y-auto">
            {searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => handleNewChat(u._id)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {u.displayName || u.username}
              </div>
            ))}
            {searchResults.length === 0 && (
              <div className="p-2 text-gray-500">No user found</div>
            )}
          </div>
        )}
      </div>

      {/* 📜 Chats List */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map((chat) => {
          const otherUser = chat.participants?.find(
            (p) => p._id !== user?._id
          );
          if (!otherUser && !chat.isGroup) return null;

          return (
            <div
              key={chat._id}
              onClick={() => dispatch(setActiveChat(chat))}
              className={`p-2 cursor-pointer hover:bg-gray-200 ${
                activeChat?._id === chat._id ? "bg-gray-300" : ""
              } flex items-center`}
            >
              <img
                src={
                  chat.isGroup
                    ? "/group.png"
                    : otherUser?.profilePic || "/default.png"
                }
                alt="avatar"
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-semibold">
                  {chat.isGroup
                    ? chat.name
                    : otherUser?.displayName || otherUser?.username}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {chat.lastMessage?.content || "No messages yet"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ➕ Floating Button */}
      <button
        onClick={() => setShowNewChat((prev) => !prev)}
        className="absolute bottom-5 right-5 bg-green-500 text-white p-4 rounded-full shadow-lg"
      >
        <FiPlus size={24} />
      </button>
    </div>
  );
}
