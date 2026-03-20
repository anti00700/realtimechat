# API Endpoint Map: MERN Stack Chat Application

## 1. Authentication Endpoints

### 1.1 User Registration & Login
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | /api/auth/login | User login with OTP | `{ email, otp }` | `{ token, user }` |
| POST | /api/auth/register | User registration | `{ email, password, username }` | `{ token, user }` |
| POST | /api/auth/verify-otp | OTP verification | `{ email, otp }` | `{ success, message }` |
| POST | /api/auth/resend-otp | Resend OTP | `{ email }` | `{ success, message }` |

### 1.2 User Management
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | /api/auth/me | Get current user | - | `{ user }` |
| PUT | /api/auth/profile | Update profile | `{ displayName, profilePic }` | `{ user }` |
| PUT | /api/auth/password | Change password | `{ currentPassword, newPassword }` | `{ success }` |

## 2. Chat Endpoints

### 2.1 Chat Management
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | /api/chat | Get user's chats | - | `{ chats }` |
| POST | /api/chat | Create new chat | `{ users, name, isGroup }` | `{ chat }` |
| GET | /api/chat/:id | Get chat details | - | `{ chat }` |
| PUT | /api/chat/:id | Update chat | `{ name, groupDescription }` | `{ chat }` |
| DELETE | /api/chat/:id | Delete chat | - | `{ success }` |

### 2.2 Chat Participants
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | /api/chat/:id/users | Add users to chat | `{ userIds }` | `{ chat }` |
| DELETE | /api/chat/:id/users/:userId | Remove user from chat | - | `{ chat }` |
| GET | /api/chat/:id/users | Get chat participants | - | `{ users }` |

## 3. Message Endpoints

### 3.1 Message Operations
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | /api/messages/:chatId | Get chat messages | `{ limit, skip }` | `{ messages }` |
| POST | /api/messages | Send message | `{ chatId, content, type }` | `{ message }` |
| PUT | /api/messages/:id | Update message | `{ content }` | `{ message }` |
| DELETE | /api/messages/:id | Delete message | - | `{ success }` |

### 3.2 Message Status
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | /api/messages/:id/read | Mark as read | - | `{ success }` |
| GET | /api/messages/unread | Get unread count | - | `{ unreadCount }` |

## 4. User Endpoints

### 4.1 User Search & Discovery
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | /api/users | Search users | `{ query, limit }` | `{ users }` |
| GET | /api/users/:id | Get user profile | - | `{ user }` |
| GET | /api/users/:id/contacts | Get user contacts | - | `{ contacts }` |

### 4.2 Contact Management
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | /api/users/:id/contacts | Add contact | - | `{ contact }` |
| DELETE | /api/users/:id/contacts | Remove contact | - | `{ success }` |

## 5. Real-time WebSocket Events

### 5.1 Connection Events
| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| connection | Server → Client | `{ user }` | Initial connection with user data |
| disconnect | Server → Client | - | User disconnected |
| onlineUsers | Server → Client | `{ users }` | Update online user list |

### 5.2 Chat Events
| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| joinChat | Client → Server | `{ chatId }` | Join chat room |
| leaveChat | Client → Server | `{ chatId }` | Leave chat room |
| newMessage | Server → Client | `{ message }` | New message received |
| messageRead | Server → Client | `{ chatId, userId }` | Message read status |
| chatUpdated | Server → Client | `{ chat }` | Chat information updated |

### 5.3 Typing Events
| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| typingStart | Client → Server | `{ chatId }` | User started typing |
| typingStop | Client → Server | `{ chatId }` | User stopped typing |
| userTyping | Server → Client | `{ userId, chatId }` | Show typing indicator |

## 6. File Upload Endpoints

### 6.1 Media Upload
| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | /api/upload | Upload file | `FormData` | `{ url, publicId }` |
| DELETE | /api/upload/:publicId | Delete file | - | `{ success }` |

## 7. Error Response Format

### 7.1 Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "details": "Email or password is incorrect"
  }
}
```

### 7.2 Validation Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_001",
    "message": "Validation failed",
    "fields": {
      "email": "Invalid email format",
      "password": "Password must be at least 6 characters"
    }
  }
}
```