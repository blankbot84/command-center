/**
 * Chat conversation types for multi-agent conversations
 */

// Unique identifier for a conversation
export type ConversationId = string; // e.g., "conv_1706900000_abc123"

// Which agent this conversation is with
export type AgentId = string; // e.g., "murphie", "eight", "console"

/**
 * A single message in a conversation
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO timestamp
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

/**
 * Tool call made by an agent
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
  result?: string;
}

/**
 * A conversation with an agent
 */
export interface Conversation {
  id: ConversationId;
  agentId: AgentId;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp (last message)
  messages: ChatMessage[];
  unreadCount: number;
}

/**
 * State stored in localStorage
 */
export interface ConversationsState {
  conversations: Conversation[];
  activeConversationId: ConversationId | null;
}

/**
 * An agent that can be chatted with
 */
export interface ChatAgent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description?: string;
  gatewayEndpoint?: string;
  available: boolean;
}
