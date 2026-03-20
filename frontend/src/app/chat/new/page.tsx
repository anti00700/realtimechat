"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createOrGetChat, fetchChats } from "@/redux/slices/chatSlice";
import { Search, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── TYPE: Search Result User ─────────────────────────────────────────────────
// Shape returned by GET /api/users/search
// user-controllers.js: .select("username displayName profilePic")
interface SearchUser {
  _id: string;
  username: string;
  displayName?: string;
  profilePic: string;
}


export default function NewChatPage() {

  const [query, setQuery] = useState<string>("");
  // The raw text the user types into the search input.

  const [results, setResults] = useState<SearchUser[]>([]);
  // The array of users returned from the search API.
  // Starts empty — no results shown until user types.

  const [isSearching, setIsSearching] = useState<boolean>(false);
  // true while the search API call is in flight.
  // Shows a spinner inside the search input.

  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  // Stores the _id of the user currently being "connected to".
  // Used to show a spinner on that specific row while createOrGetChat runs.
  // null = no chat creation in progress.

  const [searchError, setSearchError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);


  // ── DEBOUNCED SEARCH ───────────────────────────────────────────────────────
  // This useEffect pattern IS the debounce.
  // Every time `query` changes, we:
  //   1. Set up a setTimeout to run the search after 300ms
  //   2. Return a cleanup function that CANCELS that timeout
  //
  // If the user types again within 300ms, the cleanup runs and cancels
  // the previous timeout before it fires. A new timeout starts.
  // Only when the user STOPS typing for 300ms does the search actually run.

  useEffect(() => {
    // Don't search if query is empty or too short
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timeout = setTimeout(async () => {
      // This function runs 300ms after the user stopped typing.
      try {
        const response = await fetch(
          `${API_URL}/api/users/search?query=${encodeURIComponent(query.trim())}`,
          // encodeURIComponent → safely encodes special characters in the query.
          // "john doe" → "john%20doe" — spaces and symbols are URL-safe.
          { credentials: "include" }
        );

        const data = await response.json();

        if (!response.ok) {
          setSearchError("Search failed. Try again.");
          setResults([]);
          return;
        }

        // Filter out the current logged-in user from results.
        // You shouldn't be able to start a chat with yourself.
        const filtered = (data as SearchUser[]).filter(
          (u) => u._id !== user?._id
        );
        setResults(filtered);

      } catch {
        setSearchError("Network error. Could not search.");
        setResults([]);
      } finally {
        setIsSearching(false);
        // finally runs whether fetch succeeded or failed.
        // Always turn off the searching spinner.
      }
    }, 300);

    // CLEANUP FUNCTION:
    // React calls this before the next effect run OR on unmount.
    // clearTimeout cancels the pending search if user typed again.
    return () => clearTimeout(timeout);

  }, [query]);
  // [query] → re-runs every time the search text changes.


  // ── START CHAT HANDLER ────────────────────────────────────────────────────

  const handleStartChat = async (otherUser: SearchUser) => {
    setStartingChatWith(otherUser._id);
    // Mark this specific row as loading.

    const result = await dispatch(createOrGetChat(otherUser._id));
    // dispatch returns a Promise with the action result.
    // We await it to know when the thunk completes.

    if (createOrGetChat.fulfilled.match(result)) {
      // .fulfilled.match() → type-safe check that the thunk succeeded.
      // result.payload = { chatId: "...", isNew: true/false }

      await dispatch(fetchChats());
      // Refresh the sidebar chat list.
      // If this is a new chat, it won't be in the sidebar yet.
      // fetchChats() gets the updated list from the backend including the new chat.

      router.push(`/chat/${result.payload.chatId}`);
      // Navigate to the conversation.
    } else {
      setStartingChatWith(null);
      // Something failed — clear the loading state so the user can try again.
    }
  };


  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── HEADER ── */}
      <div className="h-16 px-4 border-b border-black/8 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-sm font-semibold text-black">New conversation</p>
          <p className="text-xs text-black/30">Search for someone to chat with</p>
        </div>
      </div>

      {/* ── SEARCH INPUT ── */}
      <div className="px-4 py-3 border-b border-black/8 flex-shrink-0">
        <div className="relative">
          {/* Left icon: spinner when searching, search icon when idle */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-black/30 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-black/25" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            autoFocus
            // autoFocus → focuses this input immediately when the page loads.
            // The user can start typing without clicking first.
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/4 rounded-xl outline-none placeholder:text-black/25 text-black focus:bg-black/6 transition-colors"
          />
        </div>

        {/* Hint text */}
        {query.length === 1 && (
          <p className="text-xs text-black/30 mt-2 pl-1">
            Type at least 2 characters to search
          </p>
        )}
      </div>

      {/* ── RESULTS LIST ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Error state */}
        {searchError && (
          <div className="px-4 py-3 mt-2 mx-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-500">{searchError}</p>
          </div>
        )}

        {/* Empty query state */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center h-48 px-6 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black/4 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-black/20" />
            </div>
            <p className="text-sm text-black/30">
              Search for a username to start a new conversation
            </p>
          </div>
        )}

        {/* No results */}
        {query.trim().length >= 2 && !isSearching && results.length === 0 && !searchError && (
          <div className="flex flex-col items-center justify-center h-32 px-6">
            <p className="text-sm text-black/30">
              No users found for &quot;{query}&quot;
            </p>
          </div>
        )}

        {/* Results */}
        {results.map((searchUser) => {
          const isStarting = startingChatWith === searchUser._id;
          // Is THIS specific row currently loading?

          return (
            <button
              key={searchUser._id}
              onClick={() => handleStartChat(searchUser)}
              disabled={startingChatWith !== null}
              // Disable ALL rows while any chat creation is in progress.
              // Prevents starting two chats simultaneously.
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left",
                "transition-colors duration-100",
                startingChatWith !== null
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-black/4"
              )}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                {searchUser.profilePic ? (
                  <img
                    src={searchUser.profilePic}
                    alt={searchUser.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-bold">
                    {(searchUser.displayName || searchUser.username)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">
                  {searchUser.displayName || searchUser.username}
                </p>
                <p className="text-xs text-black/40 truncate">
                  @{searchUser.username}
                </p>
              </div>

              {/* Loading indicator for this specific row */}
              {isStarting && (
                <Loader2 className="w-4 h-4 text-black/30 animate-spin flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}