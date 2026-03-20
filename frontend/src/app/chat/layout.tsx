"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { fetchChats } from "@/redux/slices/chatSlice";
import Sidebar from "@/components/chat/Sidebar";


export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { user, isLoading } = useAppSelector((state) => state.auth);

  const { isFetchingChats } = useAppSelector((state) => state.chats);


  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      dispatch(fetchChats());
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <p className="text-xs text-black/30">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
      <aside className="w-80 flex-shrink-0 border-r border-black/8 flex flex-col">
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

    </div>
  );
}