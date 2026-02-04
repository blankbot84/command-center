'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatMessage } from './chat-message';
import { TypingIndicator } from './typing-indicator';
import { ConversationHeader } from './conversation-header';
import { ConversationList, type ConversationItem } from './conversation-list';
import { AgentPicker } from './agent-picker';
import { useConversations, generateMessageId } from './hooks/use-conversations';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { chatAgents, getAgentById } from '@/lib/agents';
import { ChatTextarea } from './chat-textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

/**
 * Format a timestamp for display in conversation list
 */
function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Parse AI SDK data stream format
 */
function parseStreamChunk(chunk: string): string {
  // Format: 0:"text chunk"\n
  const match = chunk.match(/^0:"(.*)"/);
  if (match) {
    // Unescape the text
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }
  return '';
}

export function Chat() {
  const {
    sortedConversations,
    activeConversation,
    activeAgent,
    activeId,
    isLoaded,
    setActiveConversation,
    createConversation,
    addMessage,
    updateLastMessage,
    markAsRead,
  } = useConversations();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardHeight = useKeyboardHeight();

  // Get messages from active conversation
  const messages = activeConversation?.messages ?? [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // First-time user flow: if no conversations and loaded, show AgentPicker
  useEffect(() => {
    if (isLoaded && sortedConversations.length === 0 && !showAgentPicker) {
      setShowAgentPicker(true);
    }
  }, [isLoaded, sortedConversations.length, showAgentPicker]);

  // Mark conversation as read when it becomes active
  useEffect(() => {
    if (activeId && activeConversation?.unreadCount) {
      markAsRead(activeId);
    }
  }, [activeId, activeConversation?.unreadCount, markAsRead]);

  /**
   * Handle sending a message
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeId || !activeConversation) return;

    const text = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to conversation
    addMessage(activeId, {
      role: 'user',
      content: text,
    });

    // Create a placeholder assistant message for streaming
    const assistantMessage = addMessage(activeId, {
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
      // Build message history for API
      const messageHistory = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: text },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messageHistory,
          agentId: activeConversation.agentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const text = parseStreamChunk(line);
          if (text) {
            accumulatedContent += text;
            updateLastMessage(activeId, { content: accumulatedContent });
          }
        }
      }

      // Mark streaming complete
      updateLastMessage(activeId, { isStreaming: false });
    } catch (error) {
      console.error('Error sending message:', error);
      updateLastMessage(activeId, {
        content: 'Sorry, something went wrong. Please try again.',
        isStreaming: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeId, activeConversation, messages, addMessage, updateLastMessage]);

  /**
   * Handle agent selection from picker
   */
  const handleAgentSelect = useCallback((agentId: string) => {
    createConversation(agentId);
    setShowAgentPicker(false);
  }, [createConversation]);

  /**
   * Handle conversation selection
   */
  const handleConversationSelect = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
    setShowConversationList(false);
  }, [setActiveConversation]);

  /**
   * Handle new chat button
   */
  const handleNewChat = useCallback(() => {
    setShowAgentPicker(true);
  }, []);

  /**
   * Transform conversations for the list component
   */
  const conversationItems: ConversationItem[] = sortedConversations.map((conv) => {
    const agent = getAgentById(conv.agentId);
    const lastMessage = conv.messages[conv.messages.length - 1];
    return {
      id: conv.id,
      agentEmoji: agent?.emoji ?? '🤖',
      agentName: agent?.name ?? 'Unknown Agent',
      lastMessage: lastMessage?.content?.slice(0, 50) || 'No messages yet',
      timestamp: formatRelativeTime(conv.updatedAt),
      unreadCount: conv.unreadCount,
    };
  });

  // Show loading skeleton while loading from localStorage
  if (!isLoaded) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 border-b px-4 py-2">
          <div className="h-12 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="h-20 bg-muted/20 rounded animate-pulse" />
            <div className="h-20 bg-muted/20 rounded animate-pulse ml-auto w-2/3" />
          </div>
        </div>
        <div className="flex-shrink-0 border-t bg-background p-4">
          <div className="h-10 bg-muted/30 rounded animate-pulse max-w-3xl mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with agent info - fixed at top */}
      <div className="flex-shrink-0 border-b px-4 py-2">
        <ConversationHeader
          agent={activeAgent ? {
            emoji: activeAgent.emoji,
            name: activeAgent.name,
            role: activeAgent.role,
          } : null}
          onTap={() => setShowConversationList(true)}
        />
      </div>

      {/* Messages area - scrollable, takes remaining space */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain p-4"
      >
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && activeAgent && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-4xl mb-4">{activeAgent.emoji}</p>
              <p className="text-lg font-medium">Chat with {activeAgent.name}</p>
              <p className="text-sm">{activeAgent.role}</p>
            </div>
          )}
          {messages.length === 0 && !activeAgent && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg font-medium">Welcome to Command Center Chat</p>
              <p className="text-sm">Tap the header to select an agent</p>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <TypingIndicator />
          )}
        </div>
      </div>

      {/* Input area - fixed at bottom, never scrolls away */}
      <div 
        className="flex-shrink-0 border-t bg-background p-4 safe-area-bottom"
        style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : undefined }}
      >
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 items-end">
          <ChatTextarea
            value={input}
            onChange={setInput}
            onSubmit={() => {
              if (input.trim() && !isLoading && activeConversation) {
                handleSubmit({ preventDefault: () => {} } as React.FormEvent);
              }
            }}
            placeholder={activeAgent ? `Message ${activeAgent.name}...` : 'Select an agent to start...'}
            disabled={isLoading || !activeConversation}
            className="flex-1"
            minHeight={44}
            maxHeight={200}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim() || !activeConversation}
            className="h-11 w-11 shrink-0 rounded-lg"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>

      {/* Conversation List Sheet */}
      <ConversationList
        conversations={conversationItems}
        activeId={activeId ?? undefined}
        onSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        open={showConversationList}
        onOpenChange={setShowConversationList}
      />

      {/* Agent Picker Sheet */}
      <AgentPicker
        agents={chatAgents}
        onSelect={handleAgentSelect}
        open={showAgentPicker}
        onOpenChange={setShowAgentPicker}
      />
    </div>
  );
}
