## 1. Architecture Design

```mermaid
editor
```

## 2. Technology Description
- Frontend: Next.js@14 + TypeScript + TailwindCSS@3 + Vite
- Backend: Node.js + Express + MongoDB + Socket.IO
- Database: MongoDB with Mongoose ODM
- Real-time: Socket.IO for WebSocket communication

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| / | Home page, app overview and navigation |
| /login | Authentication page with OTP verification |
| /chat | Main chat interface with sidebar |
| /profile | User profile and settings |

## 4. API Definitions
### 4.1 Core API
User authentication related
```
POST /api/auth/login
```

Request:
| Param Name| Param Type  | isRequired  | Description |
|-----------|-------------|-------------|-------------|
| email  | string      | true        | User's email address |
| otp  | string      | true        | One-time password |

Response:
| Param Name| Param Type  | Description |
|-----------|-------------|-------------|
| token    | string     | JWT authentication token |
| user    | object     | User profile data |

Example
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

## 5. Server Architecture Diagram

```mermaid
editor
```

## 6. Data Model

### 6.1 Data Model Definition
```mermaid
editor
```

### 6.2 Data Definition Language
User Table (users)
```
-- create table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- create index
CREATE INDEX idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at DESC);
CREATE INDEX idx_prompt_history_score ON prompt_history(score DESC);

-- init data
INSERT INTO prompt_history (user_id, original_prompt, optimized_prompt, score, target_model)
```