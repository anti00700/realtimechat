import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  ChatsState,
  Chat,
  Message,
  ChatsApiResponse,
  MessagesApiResponse,
  SendMessagePayload,
} from "@/types/chat";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const initialState: ChatsState = {
  conversations: [],
  activeChat: null,
  messages: [],
  isFetchingChats: false,
  isFetchingMessages: false,
  isSending: false,
  isAIThinking: false,
  error: null,
};

export const fetchChats = createAsyncThunk<ChatsApiResponse>(
  "chats/fetchChats",

  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/all`, {
        method: "GET",
        credentials: "include",
      });

      const data: ChatsApiResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue((data as any).message || "Failed to load chats.");
      }

      return data;

    } catch {
      return rejectWithValue("Network error. Could not load chats.");
    }
  }
);

export const fetchMessages = createAsyncThunk<MessagesApiResponse, string>(
  "chats/fetchMessages",

  async (chatId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/api/messages/${chatId}?limit=50`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data: MessagesApiResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue((data as any).msg || "Failed to load messages.");
      }

      return data;

    } catch {
      return rejectWithValue("Network error. Could not load messages.");
    }
  }
);

export const getAIResponse = createAsyncThunk<void, { chatId: string; message: string }>(
  "chats/getAIResponse",

  async ({ chatId, message }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.msg || "AI failed to respond.");
      }
    } catch (_err) {
      return rejectWithValue("Network error. Could not reach AI.");
    }
  }
);

export interface CreateChatResult {
  chatId: string;
  isNew: boolean;
}

export const createOrGetChat = createAsyncThunk<CreateChatResult, string>(
  "chats/createOrGetChat",

  async (otherUserId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otherUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Could not start conversation."
        );
      }

      if (data.isNew) {
        return { chatId: data.chatId, isNew: true };
      }

      return { chatId: data._id, isNew: false };

    } catch {
      return rejectWithValue("Network error. Could not start conversation.");
    }
  }
);

export const sendMessage = createAsyncThunk<Message, SendMessagePayload>(
  "chats/sendMessage",

  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          chatId: payload.chatId,
          content: payload.content,
          type: payload.type || "text",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue((data as any).msg || "Failed to send message.");
      }

      return data as Message;

    } catch {
      return rejectWithValue("Network error. Could not send message.");
    }
  }
);

const chatSlice = createSlice({
  name: "chats",
  initialState,

  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat>) => {
      state.activeChat = action.payload;
      state.messages = [];
    },

    clearActiveChat: (state) => {
      state.activeChat = null;
      state.messages = [];
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      const alreadyExists = state.messages.some(
        (m) => m._id === action.payload._id
      );
      if (!alreadyExists) {
        state.messages.push(action.payload);
      }
    },

    updateLastMessage: (state, action: PayloadAction<Message>) => {
      const chatIndex = state.conversations.findIndex(
        (chat) => chat._id === action.payload.chatId
      );

      if (chatIndex !== -1) {
        state.conversations[chatIndex].lastMessage = {
          _id: action.payload._id,
          content: action.payload.content,
          senderId: action.payload.senderId._id,
          timestamp: action.payload.timestamp,
          type: action.payload.type,
        };

        const updatedChat = state.conversations.splice(chatIndex, 1)[0];
        state.conversations.unshift(updatedChat);
      }
    },

    clearChatError: (state) => {
      state.error = null;
    },

    clearConversations: (state) => {
      state.conversations = [];
      state.activeChat = null;
      state.messages = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {

    builder.addCase(fetchChats.pending, (state) => {
      state.isFetchingChats = true;
      state.error = null;
    });

    builder.addCase(
      fetchChats.fulfilled,
      (state, action: PayloadAction<ChatsApiResponse>) => {
        state.isFetchingChats = false;
        state.conversations = action.payload.chats;
      }
    );

    builder.addCase(fetchChats.rejected, (state, action) => {
      state.isFetchingChats = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchMessages.pending, (state) => {
      state.isFetchingMessages = true;
      state.error = null;
    });

    builder.addCase(
      fetchMessages.fulfilled,
      (state, action: PayloadAction<MessagesApiResponse>) => {
        state.isFetchingMessages = false;
        state.messages = action.payload.messages;
      }
    );

    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.isFetchingMessages = false;
      state.error = action.payload as string;
    });

    builder.addCase(sendMessage.pending, (state) => {
      state.isSending = true;
      state.error = null;
    });

    builder.addCase(
      sendMessage.fulfilled,
      (state, action: PayloadAction<Message>) => {
        state.isSending = false;
        const alreadyExists = state.messages.some(
          (m) => m._id === action.payload._id
        );
        if (!alreadyExists) {
          state.messages.push(action.payload);
        }
      }
    );

    builder.addCase(sendMessage.rejected, (state, action) => {
      state.isSending = false;
      state.error = action.payload as string;
    });

    builder.addCase(getAIResponse.pending, (state) => {
      state.isAIThinking = true;
    });

    builder.addCase(getAIResponse.fulfilled, (state) => {
      state.isAIThinking = false;
    });

    builder.addCase(getAIResponse.rejected, (state, action) => {
      state.isAIThinking = false;
      state.error = action.payload as string;
    });

    builder.addCase(createOrGetChat.pending, (state) => {
      state.isFetchingChats = true;
      state.error = null;
    });

    builder.addCase(createOrGetChat.fulfilled, (state) => {
      state.isFetchingChats = false;
    });

    builder.addCase(createOrGetChat.rejected, (state, action) => {
      state.isFetchingChats = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setActiveChat,
  clearActiveChat,
  addMessage,
  updateLastMessage,
  clearChatError,
  clearConversations,
} = chatSlice.actions;

export default chatSlice.reducer;