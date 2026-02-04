'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AgentId,
  ChatMessage,
  Conversation,
  ConversationId,
  ConversationsState,
} from '@/types/chat';
import { getAgentById } from '@/lib/agents';

const STORAGE_KEY = 'command-center:conversations';
const DEBOUNCE_MS = 300;

/**
 * Generate a unique conversation ID
 */
function generateConversationId(): ConversationId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `conv_${timestamp}_${random}`;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `msg_${timestamp}_${random}`;
}

/**
 * Load state from localStorage
 */
function loadFromStorage(): ConversationsState {
  if (typeof window === 'undefined') {
    return { conversations: [], activeConversationId: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ConversationsState;
      return {
        conversations: parsed.conversations || [],
        activeConversationId: parsed.activeConversationId || null,
      };
    }
  } catch (e) {
    console.error('Failed to load conversations from localStorage:', e);
  }

  return { conversations: [], activeConversationId: null };
}

/**
 * Save state to localStorage (debounced)
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function saveToStorage(state: ConversationsState): void {
  if (typeof window === 'undefined') return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save conversations to localStorage:', e);
    }
  }, DEBOUNCE_MS);
}

/**
 * Hook for managing chat conversations with localStorage persistence
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<ConversationId | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const state = loadFromStorage();
    setConversations(state.conversations);
    setActiveId(state.activeConversationId);
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage({ conversations, activeConversationId: activeId });
  }, [conversations, activeId, isLoaded]);

  /**
   * Set the active conversation
   */
  const setActiveConversation = useCallback((id: ConversationId | null) => {
    setActiveId(id);
  }, []);

  /**
   * Create a new conversation with an agent
   */
  const createConversation = useCallback((agentId: AgentId): ConversationId => {
    const now = new Date().toISOString();
    const newConversation: Conversation = {
      id: generateConversationId(),
      agentId,
      createdAt: now,
      updatedAt: now,
      messages: [],
      unreadCount: 0,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveId(newConversation.id);

    return newConversation.id;
  }, []);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(
    (id: ConversationId) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));

      // If deleting the active conversation, clear it or pick another
      if (activeId === id) {
        setActiveId((prevActiveId) => {
          const remaining = conversations.filter((c) => c.id !== id);
          return remaining.length > 0 ? remaining[0].id : null;
        });
      }
    },
    [activeId, conversations]
  );

  /**
   * Add a message to a conversation
   */
  const addMessage = useCallback(
    (conversationId: ConversationId, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const fullMessage: ChatMessage = {
        ...message,
        id: generateMessageId(),
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv;
          return {
            ...conv,
            messages: [...conv.messages, fullMessage],
            updatedAt: fullMessage.timestamp,
            // Increment unread if this isn't the active conversation and it's from assistant
            unreadCount:
              conversationId !== activeId && message.role === 'assistant'
                ? conv.unreadCount + 1
                : conv.unreadCount,
          };
        })
      );

      return fullMessage;
    },
    [activeId]
  );

  /**
   * Update the last message (for streaming)
   */
  const updateLastMessage = useCallback(
    (conversationId: ConversationId, updates: Partial<ChatMessage>) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv;
          const messages = [...conv.messages];
          const lastIndex = messages.length - 1;
          if (lastIndex >= 0) {
            messages[lastIndex] = { ...messages[lastIndex], ...updates };
          }
          return { ...conv, messages };
        })
      );
    },
    []
  );

  /**
   * Mark a conversation as read
   */
  const markAsRead = useCallback((id: ConversationId) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== id) return conv;
        return { ...conv, unreadCount: 0 };
      })
    );
  }, []);

  // Derived: active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || null;
  }, [conversations, activeId]);

  // Derived: active agent
  const activeAgent = useMemo(() => {
    if (!activeConversation) return null;
    return getAgentById(activeConversation.agentId) || null;
  }, [activeConversation]);

  // Derived: sorted conversations (most recent first)
  const sortedConversations = useMemo(() => {
    return [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations]);

  // Derived: total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [conversations]);

  return {
    // State
    conversations,
    activeId,
    isLoaded,

    // Actions
    setActiveConversation,
    createConversation,
    deleteConversation,
    addMessage,
    updateLastMessage,
    markAsRead,

    // Derived
    activeConversation,
    activeAgent,
    sortedConversations,
    totalUnread,
  };
}
