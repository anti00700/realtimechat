

import { MessageSquareDashed } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white select-none">


      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-black/4 flex items-center justify-center mb-5">
        <MessageSquareDashed className="w-7 h-7 text-black/20" />
      </div>

      {/* Text */}
      <h2 className="text-base font-semibold text-black/30 tracking-tight mb-1">
        Your conversations
      </h2>
      <p className="text-sm text-black/20 text-center max-w-xs leading-relaxed">
        Select a chat from the sidebar to start messaging.
      </p>

    </div>
  );
}