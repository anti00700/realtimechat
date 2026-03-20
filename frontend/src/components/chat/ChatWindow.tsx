"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { sendMessage, addMessage, updateLastMessage, getAIResponse } from "@/redux/slices/chatSlice";
import type { Chat, Message } from "@/types/chat";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import ImageUpload from "@/components/chat/ImageUpload";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ChatWindowProps {
  chatId: string;
  chat: Chat | null;
  isLoadingMessages: boolean;
}

function getChatDisplayName(chat: Chat, currentUserId: string): string {
  if (chat.isGroup) return chat.name || "Group Chat";
  const other = chat.users.find((u) => u._id !== currentUserId);
  return other?.displayName || other?.username || "Unknown";
}

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupMessagesByDate(messages: Message[]): {
  label: string;
  messages: Message[];
}[] {
  const groups: Record<string, Message[]> = {};

  messages.forEach((msg) => {
    const date = new Date(msg.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });

  return Object.entries(groups).map(([label, messages]) => ({
    label,
    messages,
  }));
}

export default function ChatWindow({
  chatId,
  chat,
  isLoadingMessages,
}: ChatWindowProps) {

  const [inputValue, setInputValue] = useState<string>("");

  const dispatch = useAppDispatch();
  const { messages, isSending, isAIThinking } = useAppSelector((state) => state.chats);
  const { user, token } = useAppSelector((state) => state.auth);

  const AI_BOT_ID = process.env.NEXT_PUBLIC_AI_BOT_USER_ID || "";
  const isAIChat = chat?.users.some((u) => u._id === AI_BOT_ID) ?? false;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socketRef = useRef<Socket | null>(null);


  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("userConnected");
      socket.emit("joinChat", chatId);
    });

    socket.on("newMessage", (message: Message) => {
      dispatch(addMessage(message));
      dispatch(updateLastMessage(message));
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId]);

  useEffect(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("joinChat", chatId);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending || isAIThinking) return;

    setInputValue("");

    const result = await dispatch(sendMessage({ chatId, content, type: "text" }));

    if (sendMessage.fulfilled.match(result) && isAIChat) {
      dispatch(getAIResponse({ chatId, message: content }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = chat
    ? getChatDisplayName(chat, user?._id || "")
    : "Loading...";

  const otherUser = chat?.isGroup
    ? null
    : chat?.users.find((u) => u._id !== user?._id);

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-white">

      <div className="h-16 px-4 border-b border-black/8 flex items-center gap-3 flex-shrink-0 bg-white">

        <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center flex-shrink-0">
          {otherUser?.profilePic ? (
            <img
              src={otherUser.profilePic}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-black truncate">
            {displayName}
          </p>
          <p className="text-xs text-black/30">
            {chat?.isGroup
              ? `${chat.users.length} members`
              : "Tap to view profile"}
          </p>
        </div>

      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {isLoadingMessages && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-black/20" />
              <p className="text-xs text-black/30">Loading messages...</p>
            </div>
          </div>
        )}

        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-black/30">
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {!isLoadingMessages &&
          groupedMessages.map((group) => (
            <div key={group.label}>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-black/8" />
                <span className="text-[11px] text-black/30 font-medium px-2">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-black/8" />
              </div>

              <div className="flex flex-col gap-1">
                {group.messages.map((message) => {
                  const isOwn = message.senderId._id === user?._id;

                  return (
                    <div
                      key={message._id}
                      className={cn(
                        "flex flex-col max-w-[70%] gap-1",
                        isOwn ? "self-end items-end" : "self-start items-start"
                      )}
                    >
                      {!isOwn && chat?.isGroup && (
                        <span className="text-[11px] text-black/40 px-1">
                          {message.senderId.displayName ||
                            message.senderId.username}
                        </span>
                      )}

                      <div
                        className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                          isOwn
                            ? "bg-black text-white rounded-br-sm"
                            : "bg-black/6 text-black rounded-bl-sm"
                        )}
                      >
                        {message.type === "image" ? (
                          <img
                            src={message.content}
                            alt="Shared image"
                            className="max-w-[240px] rounded-xl"
                          />
                        ) : (
                          <span className="whitespace-pre-wrap break-words">
                            {message.content}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-black/25 px-1">
                        {formatMessageTime(message.timestamp)}
                      </span>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {isAIThinking && (
          <div className="flex flex-col max-w-[70%] self-start items-start gap-1 mt-1">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-black/6">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-black/25 px-1">
              Batchit AI is thinking...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-black/8 flex-shrink-0 bg-white">
        <div className="flex items-end gap-2">

          <ImageUpload
            chatId={chatId}
            onSent={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className={cn(
                "w-full px-4 py-2.5 text-sm text-black bg-black/4 rounded-xl",
                "outline-none resize-none placeholder:text-black/25",
                "focus:bg-black/6 transition-colors",
                "max-h-32 overflow-y-auto"
              )}
              style={{
                height: "auto",
                minHeight: "40px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              "transition-all duration-150",
              inputValue.trim() && !isSending
                ? "bg-black text-white hover:bg-black/80"
                : "bg-black/8 text-black/20 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>

        </div>

        <p className="text-[10px] text-black/15 mt-1.5 pl-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  );
}