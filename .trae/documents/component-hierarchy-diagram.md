# Component Hierarchy Diagram: MERN Stack Chat Application

## 1. Component Architecture

### 1.1 Page-Level Components
```
App
├── HomePage
├── LoginPage
│   ├── LoginForm
│   └── OTPForm
├── ChatPage
│   ├── Sidebar
│   │   ├── ChatList
│   │   │   ├── ChatCard
│   │   │   └── CreateChatButton
│   │   └── ContactList
│   │       ├── ContactCard
│   │       └── SearchBar
│   ├── ChatArea
│   │   ├── MessageList
│   │   │   ├── MessageBubble
│   │   │   └── SystemMessage
│   │   ├── InputArea
│   │   │   ├── MessageInput
│   │   │   ├── AttachmentButton
│   │   │   └── SendButton
│   └── TypingIndicator
├── ProfilePage
│   ├── ProfileHeader
│   ├── ProfileForm
│   └── ContactManager
└── SettingsPage
    ├── SettingsForm
    └── NotificationSettings
```

### 1.2 Component Breakdown

#### 1.2.1 Layout Components
- **App**: Main application wrapper with routing and context providers
- **Layout**: Page layout with header, sidebar, and main content area
- **Header**: Navigation bar with user info and menu

#### 1.2.2 Form Components
- **LoginForm**: Email input and submit button
- **OTPForm**: OTP input fields and verification button
- **RegisterForm**: User registration form
- **ProfileForm**: User profile editing form
- **SettingsForm**: Application settings form

#### 1.2.3 Chat Components
- **ChatList**: Container for all chat cards
- **ChatCard**: Individual chat preview with last message
- **MessageList**: Container for all messages in a chat
- **MessageBubble**: Individual message with sender info and timestamp
- **InputArea**: Message input container with attachment options

#### 1.2.4 Navigation Components
- **Sidebar**: Main navigation with collapsible sections
- **ContactList**: List of user contacts
- **SearchBar**: Search functionality for chats and contacts
- **CreateChatButton**: Button to initiate new chat creation

## 2. State Management Architecture

### 2.1 Redux Slices
```
Redux Store
├── authSlice
│   ├── user
│   ├── token
│   ├── isAuthenticated
│   └── error
├── chatSlice
│   ├── chats
│   ├── currentChat
│   ├── messages
│   ├── onlineUsers
│   └── typingUsers
├── uiSlice
│   ├── sidebarOpen
│   ├── modalOpen
│   ├── loading
│   └── error
└── userSlice
    ├── profile
    ├── contacts
    └── settings
```

### 2.2 Context Providers
- **AuthProvider**: Authentication state and user data
- **ChatProvider**: Chat-related state and real-time updates
- **UIProvider**: UI state like loading, modals, and notifications
- **SocketProvider**: WebSocket connection and event handling

## 3. Data Flow Architecture

### 3.1 Component Communication
```
User Action → Component → Redux Action → Reducer → State Update → Component Re-render
```

### 3.2 Real-time Data Flow
```
Socket Event → SocketProvider → Redux Dispatch → State Update → Component Re-render
```

## 4. Responsive Design Hierarchy

### 4.1 Mobile Layout
```
Mobile View
├── Bottom Navigation
│   ├── Chats Tab
│   ├── Contacts Tab
│   └── Profile Tab
├── Chat List Overlay (when chat selected)
└── Message Area
```

### 4.2 Desktop Layout
```
Desktop View
├── Fixed Sidebar
│   ├── Chat List
│   └── Contact List
└── Main Content Area
    ├── Message Area
    └── Input Area
```

## 5. Component Props Flow

### 5.1 ChatCard Props
```typescript
interface ChatCardProps {
  chat: Chat;
  isActive: boolean;
  onSelectChat: (chatId: string) => void;
  onRemoveChat: (chatId: string) => void;
}
```

### 5.2 MessageBubble Props
```typescript
interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onMessageClick: (messageId: string) => void;
  onMessageLongPress: (messageId: string) => void;
}
```

### 5.3 InputArea Props
```typescript
interface InputAreaProps {
  chatId: string;
  onSendMessage: (content: string, type?: string) => void;
  onAttachmentSelect: (file: File) => void;
  disabled: boolean;
}
```