import type { User } from "./auth";

export interface Topic {
  _id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface UnreadCount {
  userId: string;
  count: number;
}

export interface ReadReceipt {
  userId: string;
  timestamp: string;
}

export interface Chat {
  _id: string;

  name?: string;

  isGroup: boolean;

  groupDescription?: string;
  groupIcon?: string;

  users: Pick<User, "_id" | "username" | "profilePic" | "displayName">[];

  admins: string[];

  createdBy: string;
  adminOnly: boolean;

  lastMessage?: PopulatedLastMessage;

  pinnedMessages: string[];

  topics: Topic[];
  topicBubblesEnabled: boolean;

  archivedBy: string[];
  unreadCounts: UnreadCount[];

  unreadCount: number;

  createdAt: string;
  updatedAt: string;
}


export interface PopulatedLastMessage {
  _id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: MessageType;
}

export type MessageType = "text" | "image" | "video" | "file" | "topic";

export interface MessageSender {
  _id: string;
  username: string;
  displayName?: string;
  profilePic: string;
}

export interface Message {
  _id: string;

  senderId: MessageSender;

  receiverId?: string;

  chatId: string;

  content: string;

  type: MessageType;

  topic?: string;

  description?: string;

  readBy: ReadReceipt[];

  timestamp: string;
}

export interface ChatsState {
  conversations: Chat[];

  activeChat: Chat | null;

  messages: Message[];

  isFetchingChats: boolean;

  isFetchingMessages: boolean;

  isSending: boolean;

  isAIThinking: boolean;
  
  error: string | null;
}

export interface ChatsApiResponse {
  message: string;
  chats: Chat[];
  count: number;
}

export interface MessagesApiResponse {
  message: string;
  messages: Message[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface SendMessagePayload {
  chatId: string;
  content: string;
  type?: MessageType;
}

export interface CreateChatPayload {
  otherUserId: string;
}