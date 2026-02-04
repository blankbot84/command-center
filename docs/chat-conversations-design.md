# Chat Conversations & Agent Switching UX

## Overview

Transform the Command Center chat from single-session to multi-conversation, where each conversation maps to a different Clawdbot agent (murphie, eight, console, etc).

**Goal:** iMessage-like experience — tap to switch conversations, clear indication of who you're talking to, easy to start new chats.

---

## Recommended UX Pattern

### The "Conversation Header" Pattern (Mobile-First)

After evaluating sidebar vs dropdown approaches:

**Recommendation: Tappable Header + Sheet Conversation List**

Why not a persistent sidebar?
- Mobile-first constraint — sidebars eat screen real estate
- Chat needs full width for messages
- App already has a main nav sidebar (would conflict)

Why not a dropdown?
- Dropdowns are cramped for conversation previews
- Hard to show last message preview
- Doesn't match messaging app mental model

**Solution:** 
1. Header shows current agent (tappable)
2. Tap header → Sheet slides up with conversation list
3. "New Chat" button opens agent picker
4. Feels like iMessage/WhatsApp conversation switching

---

## Wireframe (ASCII)

### Main Chat View
```
┌─────────────────────────────────────┐
│ ☰  ┌──────────────────┐             │
│    │ 🧪 Murphie    ▾  │             │  ← Tappable header
│    │ QA Specialist    │             │
│    └──────────────────┘             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────┐            │
│  │ Hey, can you help   │            │
│  │ with the tests?     │            │
│  └─────────────────────┘            │
│                                     │
│            ┌────────────────────┐   │
│            │ Sure! Running the  │   │
│            │ visual regression  │   │
│            │ suite now...       │   │
│            └────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│ [Type a message...          ] [➤]  │
└─────────────────────────────────────┘
```

### Conversation List (Sheet)
```
┌─────────────────────────────────────┐
│           CONVERSATIONS             │
│         [+ New Chat]                │  ← Right-aligned button
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🧪 Murphie                  │    │
│  │ Sure! Running the visual...│ 2m │  ← Preview + timestamp
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🏢 Eight                    │    │
│  │ GA4 integration complete   │ 1h │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💥 Console                  │    │
│  │ Build succeeded. Deployed  │ 3d │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📰 Daily Brief          ●  │    │  ← Unread indicator
│  │ Here's your morning sum... │ 5d │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### New Chat Agent Picker (Sheet)
```
┌─────────────────────────────────────┐
│           NEW CONVERSATION          │
│      Choose an agent to chat        │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🧪 Murphie                  │    │
│  │ QA Specialist               │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🏢 Eight                    │    │
│  │ Dealership Dev              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💥 Console                  │    │
│  │ DevOps & Deployment         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📰 Daily Brief              │    │
│  │ Strategic Synthesis         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## Component Structure

```
src/components/chat/
├── chat.tsx                    # Main orchestrator (updated)
├── chat-message.tsx            # Individual message (existing)
├── typing-indicator.tsx        # Loading state (existing)
├── conversation-header.tsx     # NEW: Agent display + tap target
├── conversation-list.tsx       # NEW: Sheet with conversation list
├── agent-picker.tsx            # NEW: New chat agent selection
└── hooks/
    └── use-conversations.ts    # NEW: Conversation state management
```

### Component Responsibilities

#### `ConversationHeader`
- Shows current agent emoji, name, role
- Chevron indicating tappable
- Opens ConversationList on tap
- Status indicator (connected/typing/offline)

#### `ConversationList`
- Sheet component (slides from bottom on mobile)
- List of all conversations sorted by recency
- Shows: agent emoji, name, last message preview, timestamp
- Unread badge for unseen messages
- "New Chat" button in header

#### `AgentPicker`
- Grid/list of available agents
- Shows agent emoji, name, role, status
- Creates new conversation on select
- Can filter/search if many agents

#### `useConversations` Hook
- Manages conversation state
- Handles localStorage persistence
- Provides: conversations, activeId, setActive, createNew, deleteConvo

---

## Data Model

### Types

```typescript
// Unique identifier for a conversation
type ConversationId = string; // e.g., "conv_1706900000_abc123"

// Which agent this conversation is with
type AgentId = string; // e.g., "murphie", "eight", "console"

interface Conversation {
  id: ConversationId;
  agentId: AgentId;
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp (last message)
  messages: ChatMessage[];     // Full message history
  unreadCount: number;         // Messages since last viewed
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];      // For agent responses with tools
  isStreaming?: boolean;
}

interface ConversationsState {
  conversations: Conversation[];
  activeConversationId: ConversationId | null;
}
```

### localStorage Schema

```typescript
// Key: "command-center:conversations"
// Value: JSON stringified ConversationsState

const STORAGE_KEY = "command-center:conversations";

// Example stored value:
{
  "conversations": [
    {
      "id": "conv_1706900000_abc123",
      "agentId": "murphie",
      "createdAt": "2024-02-03T10:00:00.000Z",
      "updatedAt": "2024-02-03T12:30:00.000Z",
      "messages": [...],
      "unreadCount": 0
    }
  ],
  "activeConversationId": "conv_1706900000_abc123"
}
```

### Agent Registry

Extend existing `mission-control-data.ts` or create new `agents.ts`:

```typescript
interface ChatAgent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description?: string;       // For agent picker
  gatewayEndpoint?: string;   // If agents have different endpoints
  available: boolean;         // Can we chat with this agent?
}

// Pull from existing Agent type, add chat-specific fields
export const chatAgents: ChatAgent[] = [
  { id: 'murphie', name: 'Murphie', emoji: '🧪', role: 'QA Specialist', available: true },
  { id: 'eight', name: 'Eight', emoji: '🏢', role: 'Dealership Dev', available: true },
  { id: 'console', name: 'Console', emoji: '💥', role: 'DevOps', available: true },
  { id: 'daily', name: 'Daily Brief', emoji: '📰', role: 'Strategic Synthesis', available: true },
];
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    useConversations                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  State:                                                  │
│  ├── conversations: Conversation[]                       │
│  ├── activeId: string | null                            │
│  └── isLoading: boolean                                  │
│                                                          │
│  Actions:                                                │
│  ├── loadFromStorage()     // On mount                  │
│  ├── saveToStorage()       // On state change           │
│  ├── setActiveConversation(id)                          │
│  ├── createConversation(agentId) → ConversationId       │
│  ├── deleteConversation(id)                             │
│  ├── addMessage(convId, message)                        │
│  └── markAsRead(id)                                     │
│                                                          │
│  Derived:                                                │
│  ├── activeConversation: Conversation | null            │
│  ├── activeAgent: ChatAgent | null                      │
│  └── sortedConversations: Conversation[] (by updatedAt) │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## User Flows

### Flow 1: Open Chat (First Time)
1. User navigates to Chat view
2. No conversations exist → Show AgentPicker
3. User taps an agent
4. New conversation created → Chat opens

### Flow 2: Open Chat (Returning)
1. User navigates to Chat view
2. Load last active conversation from localStorage
3. Show chat with that agent
4. Header shows agent info

### Flow 3: Switch Conversation
1. User taps ConversationHeader
2. ConversationList sheet opens
3. User taps a different conversation
4. Sheet closes, chat switches to new conversation
5. Mark new conversation as read

### Flow 4: Start New Chat
1. User taps ConversationHeader → ConversationList opens
2. User taps "New Chat" button
3. AgentPicker sheet opens
4. User selects agent
5. New conversation created and becomes active

### Flow 5: Delete Conversation
1. User swipes left on conversation in list (mobile)
2. Or: long-press → "Delete" option
3. Confirm dialog
4. Conversation deleted from storage

---

## Design Tokens

Leverage existing TMNT color scheme:

```typescript
const agentColors: Record<string, string> = {
  murphie: 'donnie',   // Purple
  eight: 'raph',       // Red  
  console: 'leo',      // Blue
  daily: 'mikey',      // Orange
};
```

Use for:
- Border accent on ConversationHeader
- Active indicator in ConversationList
- Agent card in AgentPicker

---

## Mobile Considerations

### Touch Targets
- Conversation list items: min 48px height
- Header tap area: full width, min 48px height
- Agent picker cards: min 56px height

### Gestures
- Swipe down on sheet to dismiss
- Swipe left on conversation to reveal delete
- Pull-to-refresh on conversation list? (future)

### Performance
- Virtualize conversation list if >20 conversations
- Lazy load old messages (pagination)
- Debounce localStorage writes (300ms)

---

## Future Enhancements (Not in V1)

1. **Search conversations** — Find messages across all chats
2. **Conversation archiving** — Hide old convos without deleting
3. **Pinned conversations** — Keep favorites at top
4. **Conversation titles** — Auto-generate or user-set
5. **Export conversation** — Share as markdown/text
6. **Sync to Convex** — Move from localStorage to cloud
7. **Keyboard shortcuts** — `Cmd+N` for new, `Cmd+[1-9]` for switching

---

## Implementation Order

### Phase 1: Core Infrastructure
1. Create `useConversations` hook with localStorage
2. Create `Conversation` and `ChatAgent` types
3. Build agent registry

### Phase 2: UI Components  
4. Build `ConversationHeader` component
5. Build `ConversationList` sheet
6. Build `AgentPicker` sheet

### Phase 3: Integration
7. Update `Chat` component to use conversations
8. Wire up gateway calls with agentId
9. Handle message persistence

### Phase 4: Polish
10. Add unread badges
11. Add swipe-to-delete
12. Add empty states
13. Add loading skeletons

---

## Open Questions

1. **One conversation per agent, or multiple?**
   - Recommendation: Multiple (like you can have multiple SMS threads with same person)
   - Allows "start fresh" while keeping history

2. **How to handle gateway agent switching?**
   - Does gateway need agentId in request?
   - Or is it URL-path based (`/agents/murphie/chat`)?

3. **Message size limits?**
   - localStorage has ~5MB limit
   - May need to prune old messages or paginate

4. **Offline support?**
   - Queue messages when offline?
   - Show connection status?

---

*Design doc created: 2024-02-04*  
*Author: Murphie 🧪*
