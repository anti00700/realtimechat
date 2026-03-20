"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setActiveChat, clearConversations } from "@/redux/slices/chatSlice";
import { logout } from "@/redux/slices/authSlice";
import type { Chat } from "@/types/chat";
import { Search, LogOut, MessageSquarePlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfilePanel from "@/components/chat/ProfilePanel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const AI_BOT_ID = process.env.NEXT_PUBLIC_AI_BOT_USER_ID || "";


function getChatDisplayName(chat: Chat, currentUserId: string): string {
  if (chat.isGroup) {
    return chat.name || "Group Chat";
  }
  const otherUser = chat.users.find((u) => u._id !== currentUserId);
  return otherUser?.displayName || otherUser?.username || "Unknown";
}


function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}


function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const daysDiff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "numeric", day: "numeric" });
}


function getLastMessagePreview(chat: Chat): string {
  if (!chat.lastMessage) return "No messages yet";
  if (chat.lastMessage.type === "image") return "📷 Photo";
  if (chat.lastMessage.type === "video") return "🎥 Video";
  if (chat.lastMessage.type === "file") return "📎 File";
  if (chat.lastMessage.type === "topic") return "💬 Topic";
  return chat.lastMessage.content || "";
}


export default function Sidebar() {

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { conversations, isFetchingChats } = useAppSelector(
    (state) => state.chats
  );

  const filtered = conversations.filter((chat) => {
    if (!searchQuery.trim()) return true;

    const name = getChatDisplayName(chat, user?._id || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query);
  });


  const handleChatClick = (chat: Chat) => {
    dispatch(setActiveChat(chat));

    router.push(`/chat/${chat._id}`);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
    }

    dispatch(logout());
    dispatch(clearConversations());
    router.replace("/login");
  };


  return (
    <div className="flex flex-col h-full bg-white">

      <div className="px-4 py-4 border-b border-black/8 flex items-center justify-between flex-shrink-0">
        <span className="text-base font-black tracking-tighter text-black">
          batchit
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/chat/new")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors"
            aria-label="New conversation"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-black/8 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full pl-9 pr-4 py-2 text-sm bg-black/4 border-none rounded-xl outline-none placeholder:text-black/25 text-black focus:bg-black/6 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {isFetchingChats && (
          <div className="flex flex-col gap-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-black/6 animate-pulse flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div
                    className="h-3 bg-black/6 rounded-full animate-pulse"
                    style={{ width: `${60 + (i % 3) * 15}%` }}
                  />
                  <div className="h-2.5 bg-black/4 rounded-full animate-pulse w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isFetchingChats && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 px-6 text-center">
            <p className="text-sm text-black/30">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No conversations yet."}
            </p>
          </div>
        )}

        {!isFetchingChats &&
          filtered.map((chat) => {
            const displayName = getChatDisplayName(chat, user?._id || "");
            const isActive = pathname === `/chat/${chat._id}`;
            const isAIChat = chat.users.some((u) => u._id === AI_BOT_ID);

            return (
              <button
                key={chat._id}
                onClick={() => handleChatClick(chat)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left",
                  "hover:bg-black/4 transition-colors duration-100",
                  isActive && "bg-black/6"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isAIChat ? "bg-black" : "bg-black"
                  )}>
                    {isAIChat ? (
                      <Sparkles className="w-5 h-5 text-white" />
                    ) : !chat.isGroup &&
                      chat.users.find((u) => u._id !== user?._id)?.profilePic ? (
                      <img
                        src={chat.users.find((u) => u._id !== user?._id)?.profilePic}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {getInitial(displayName)}
                      </span>
                    )}
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-black truncate">
                        {isAIChat ? "Batchit AI" : displayName}
                      </span>
                      {isAIChat && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-black text-white rounded-full flex-shrink-0">
                          AI
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-black/30 flex-shrink-0">
                      {formatTimestamp(chat.lastMessage?.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-black/40 truncate">
                    {isAIChat && !chat.lastMessage
                      ? "Your personal AI assistant ✨"
                      : getLastMessagePreview(chat)
                    }
                  </p>
                </div>
              </button>
            );
          })}
      </div>

      <div className="border-t border-black/8 flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/4 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user?.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-bold">
                {getInitial(user?.displayName || user?.username || "?")}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-black truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-[10px] text-black/30">
              View profile
            </p>
          </div>
        </button>
      </div>

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

    </div>
  );
}