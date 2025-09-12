"use client";
import { useEffect } from "react";
import Sidebar from "../../components/Chat/Sidebar";
import ChatArea from "../../components/Chat/ChatArea";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import io from "socket.io-client";

const socket = io("http://localhost:5000", { withCredentials: true });

export default function ChatPage() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      socket.emit("userConnected", user._id);
    }
  }, [isAuthenticated, router, user]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <ChatArea socket={socket} />
    </div>
  );
}
