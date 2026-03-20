"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMessages } from "@/redux/slices/chatSlice";
import ChatWindow from "@/components/chat/ChatWindow";


export default function ChatIdPage() {

  const params = useParams();
  const chatId = params.chatId as string;

  const dispatch = useAppDispatch();
  const { conversations, isFetchingMessages } = useAppSelector(
    (state) => state.chats
  );

  const activeChat = conversations.find((c) => c._id === chatId) || null;


  useEffect(() => {
    if (chatId) {
      dispatch(fetchMessages(chatId));
    }
  }, [chatId]);


  return (
    <ChatWindow
      chatId={chatId}
      chat={activeChat}
      isLoadingMessages={isFetchingMessages}
    />
  );
}