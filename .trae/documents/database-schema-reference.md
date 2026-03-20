# Database Schema Reference: MERN Stack Chat Application

## 1. MongoDB Collections Overview

### 1.1 Users Collection
```javascript
{
  _id: ObjectId,
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePic: {
    type: String,
    default: ""
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  contacts: [{
    chat: { type: ObjectId, ref: "Chat" },
    addedAt: { type: Date, default: Date.now }
  }],
  lastActive: { type: Date, default: Date.now },
  createdAt: Date,
  updatedAt: Date
}
```

### 1.2 Chats Collection
```javascript
{
  _id: ObjectId,
  name: { type: String, trim: true },
  isGroup: { type: Boolean, default: false },
  groupDescription: { type: String, trim: true, default: "" },
  users: [{
    type: ObjectId,
    ref: "User",
    required: true
  }],
  admins: [{ type: ObjectId, ref: "User" }],
  adminOnly: { type: Boolean, default: false },
  createdBy: { type: ObjectId, ref: "User", required: true },
  lastMessage: { type: ObjectId, ref: "Message" },
  pinnedMessages: [{ type: ObjectId, ref: "Message" }],
  topics: [{
    name: { type: String, required: true, trim: true },
    createdBy: { type: ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  topicBubblesEnabled: { type: Boolean, default: false },
  archivedBy: [{ type: ObjectId, ref: "User" }],
  unreadCounts: [{
    userId: { type: ObjectId, ref: 'User' },
    count: { type: Number, default: 0 }
  }],
  groupIcon: { type: String }, // Cloudinary URL for group photo
  createdAt: Date,
  updatedAt: Date
}
```

### 1.3 Messages Collection
```javascript
{
  _id: ObjectId,
  senderId: {
    type: ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: ObjectId,
    ref: "User" // Only for direct 1-on-1 chats
  },
  chatId: {
    type: ObjectId,
    ref: "Chat",
    required: true
  },
  content: {
    type: String,
    trim: true,
    required: function () {
      return this.type !== "topic"; // text/image/video/file must have content
    }
  },
  type: {
    type: String,
    enum: ["text", "image", "video", "file", "topic"],
    default: "text"
  },
  topic: {
    type: ObjectId
  },
  description: {
    type: String,
    trim: true,
    required: function () {
      return this.type === "topic"; // Topic messages need description
    }
  },
  readBy: [{
    userId: { type: ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  meta: {
    // For image/video/file metadata
    public_id: String,
    format: String,
    bytes: Number,
    width: Number,
    height: Number
  }
}
```

## 2. Database Relationships

### 2.1 User Relationships
- **One-to-Many**: User → Chats (user can create multiple chats)
- **Many-to-Many**: User ↔ Chat (users can participate in multiple chats)
- **One-to-Many**: User → Messages (user can send multiple messages)
- **One-to-Many**: User → Contacts (user can have multiple contacts)

### 2.2 Chat Relationships
- **Many-to-Many**: Chat ↔ Users (chat can have multiple users)
- **One-to-Many**: Chat → Messages (chat can have multiple messages)
- **One-to-Many**: Chat → Topics (chat can have multiple topics)
- **One-to-Many**: Chat → Admins (chat can have multiple admins)

### 2.3 Message Relationships
- **Many-to-One**: Message → User (message has one sender)
- **Many-to-One**: Message → Chat (message belongs to one chat)
- **Many-to-Many**: Message ↔ Users (message can be read by multiple users)

## 3. Indexes and Performance

### 3.1 Required Indexes
```javascript
// Users collection indexes
users.createIndex({ username: 1 }, { unique: true });
users.createIndex({ email: 1 }, { unique: true });
users.createIndex({ lastActive: -1 });

// Chats collection indexes
chats.createIndex({ users: 1 });
chats.createIndex({ isGroup: 1 });
chats.createIndex({ "topics.name": "text" });
chats.createIndex({ "unreadCounts.userId": 1 });

// Messages collection indexes
messages.createIndex({ chatId: 1, timestamp: -1 });
messages.createIndex({ senderId: 1 });
messages.createIndex({ receiverId: 1 });
messages.createIndex({ "readBy.userId": 1 });
```

### 3.2 Performance Considerations
- **Chat messages**: Index on `{ chatId: 1, timestamp: -1 }` for efficient message retrieval
- **User search**: Index on `{ username: 1 }` and `{ email: 1 }` for fast lookups
- **Online status**: Index on `{ lastActive: -1 }` for active user queries
- **Unread counts**: Index on `{ "unreadCounts.userId": 1 }` for efficient unread message counting

## 4. Data Validation Rules

### 4.1 User Validation
- **Username**: Required, unique, 3-30 characters, alphanumeric
- **Email**: Required, unique, valid email format
- **Password**: Required, minimum 6 characters
- **Display Name**: Optional, maximum 50 characters

### 4.2 Chat Validation
- **Name**: Optional, maximum 100 characters
- **Group Description**: Optional, maximum 500 characters
- **Users**: Required, minimum 2 users for group chats
- **Topics**: Name required, maximum 50 characters

### 4.3 Message Validation
- **Content**: Required for text/image/video/file types
- **Type**: Must be one of: text, image, video, file, topic
- **Description**: Required for topic type messages
- **File Size**: Maximum 10MB for attachments

## 5. Data Migration Strategy

### 5.1 Migration Steps
1. **Backup existing data**: Create complete database backup
2. **Schema validation**: Validate all existing documents against new schema
3. **Data transformation**: Transform data to match new schema requirements
4. **Index creation**: Create required indexes for performance
5. **Testing**: Verify data integrity and application functionality

### 5.2 Rollback Plan
- **Point-in-time recovery**: Use MongoDB's point-in-time recovery
- **Backup restoration**: Restore from latest backup if migration fails
- **Data validation**: Verify data consistency after rollback

## 6. Security Considerations

### 6.1 Data Protection
- **Password hashing**: Use bcrypt for password storage
- **Sensitive data**: Encrypt sensitive fields like passwords and tokens
- **Access control**: Implement role-based access control (RBAC)

### 6.2 Data Retention
- **Message retention**: Configurable retention period for messages
- **User data**: GDPR compliance for user data deletion
- **Audit logs**: Maintain audit logs for security monitoring

## 7. Scalability Considerations

### 7.1 Sharding Strategy
- **Users collection**: Shard by user ID for even distribution
- **Messages collection**: Shard by chat ID for chat-based queries
- **Chats collection**: Shard by chat ID for chat management

### 7.2 Read/Write Separation
- **Read replicas**: Use read replicas for chat list and user queries
- **Write operations**: Direct writes to primary for message sending
- **Caching**: Implement Redis caching for frequently accessed data