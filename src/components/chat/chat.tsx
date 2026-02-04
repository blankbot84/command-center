'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatMessage } from './chat-message';
import { TypingIndicator } from './typing-indicator';
import { ConversationHeader } from './conversation-header';
import { ConversationList, type ConversationItem } from './conversation-list';
import { AgentPicker } from './agent-picker';
import { useConversations, generateMessageId } from './hooks/use-conversations';
import { chatAgents, getAgentById } from '@/lib/agents';
import { ChatTextarea } from './chat-textarea';
import { Send, Plus, Mic, Sparkles, ChevronDown } from 'lucide-react';
import type { ChatMessage as ChatMessageType, ChatAgent } from '@/types/chat';
import { getIcon, getAgentColors } from '@/lib/icons';
import { cn } from '@/lib/utils';

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
  const match = chunk.match(/^0:"(.*)"/);
  if (match) {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }
  return '';
}

/**
 * ChatGPT-style empty state - elegant, centered
 */
function EmptyConversationHero({ agent }: { agent: ChatAgent }) {
  const Icon = getIcon(agent.icon);
  const colors = getAgentColors(agent.id);
  
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Agent avatar */}
      <div className={cn(
        'flex h-16 w-16 items-center justify-center rounded-full mb-4',
        'bg-gradient-to-br',
        colors.bg
      )}>
        <Icon className={cn('h-8 w-8', colors.text)} />
      </div>
      
      {/* Welcome text */}
      <h2 className="text-xl font-semibold text-foreground mb-1">
        {agent.name}
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {agent.role}
      </p>
    </div>
  );
}

/**
 * Welcome state when no agent selected
 */
function WelcomeHero({ onSelectAgent }: { onSelectAgent: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* App icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
        <Sparkles className="h-8 w-8 text-white drop-shadow-glow" />
      </div>
      
      {/* Welcome text */}
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Command Center
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        Chat with your AI agents
      </p>
      
      <button
        onClick={onSelectAgent}
        className={cn(
          'px-5 py-2.5 rounded-full',
          'bg-foreground text-background',
          'font-medium text-sm',
          'hover:opacity-90 transition-opacity',
          'touch-manipulation active:scale-[0.98]'
        )}
      >
        Start a conversation
      </button>
    </div>
  );
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

  const messages = activeConversation?.messages ?? [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // First-time user flow
  useEffect(() => {
    if (isLoaded && sortedConversations.length === 0 && !showAgentPicker) {
      // Don't auto-show picker, let them click the button
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
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !activeId || !activeConversation) return;

    const text = input.trim();
    setInput('');
    setIsLoading(true);

    addMessage(activeId, {
      role: 'user',
      content: text,
    });

    const assistantMessage = addMessage(activeId, {
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
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

  const handleAgentSelect = useCallback((agentId: string) => {
    createConversation(agentId);
    setShowAgentPicker(false);
  }, [createConversation]);

  const handleConversationSelect = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
    setShowConversationList(false);
  }, [setActiveConversation]);

  const handleNewChat = useCallback(() => {
    setShowAgentPicker(true);
  }, []);

  const conversationItems: ConversationItem[] = sortedConversations.map((conv) => {
    const agent = getAgentById(conv.agentId);
    const lastMessage = conv.messages[conv.messages.length - 1];
    return {
      id: conv.id,
      agentId: conv.agentId,
      agentIcon: agent?.icon ?? 'bot',
      agentName: agent?.name ?? 'Unknown Agent',
      lastMessage: lastMessage?.content?.slice(0, 50) || 'No messages yet',
      timestamp: formatRelativeTime(conv.updatedAt),
      unreadCount: conv.unreadCount,
    };
  });

  // Loading skeleton
  if (!isLoaded) {
    return (
      <div className="chat-container">
        <div className="chat-messages-area">
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="h-16 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse mb-4" />
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="chat-input-area">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Agent selector bar - compact */}
      {activeAgent && (
        <div className="flex-shrink-0 flex items-center justify-center py-2 border-b border-border/30">
          <button
            onClick={() => setShowConversationList(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-medium">{activeAgent.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="chat-messages-area">
        {messages.length === 0 && activeAgent && (
          <EmptyConversationHero agent={activeAgent} />
        )}
        {messages.length === 0 && !activeAgent && (
          <WelcomeHero onSelectAgent={handleNewChat} />
        )}
        {messages.length > 0 && (
          <div className="space-y-4 max-w-3xl mx-auto px-4 py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                agentId={activeAgent?.id}
                agentIcon={activeAgent?.icon}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>

      {/* Input area - ChatGPT style pill */}
      <div className="chat-input-area">
        <div className="max-w-3xl mx-auto px-3">
          <form onSubmit={handleSubmit} className="chat-input-pill">
            {/* Plus button */}
            <button
              type="button"
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-full shrink-0',
                'text-zinc-400 hover:text-foreground hover:bg-zinc-700/50',
                'transition-colors touch-manipulation'
              )}
              aria-label="Add attachment"
            >
              <Plus className="h-5 w-5 text-emerald-400" />
            </button>
            
            {/* Input */}
            <div className="flex-1 min-w-0 px-2">
              <ChatTextarea
                value={input}
                onChange={setInput}
                onSubmit={() => {
                  if (input.trim() && !isLoading && activeConversation) {
                    handleSubmit();
                  }
                }}
                placeholder={activeAgent ? `Message ${activeAgent.name}...` : 'Select an agent to start...'}
                disabled={isLoading || !activeConversation}
                minHeight={24}
                maxHeight={120}
              />
            </div>
            
            {/* Send button - circular, colored when active */}
            <button 
              type="submit" 
              disabled={isLoading || !input.trim() || !activeConversation}
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-full shrink-0',
                'transition-all duration-200 touch-manipulation',
                input.trim() && activeConversation
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-400'
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4 text-blue-500" />
            </button>
          </form>
          
          {/* Safety text */}
          <p className="text-[10px] text-zinc-500 text-center mt-2 pb-1">
            AI can make mistakes. Consider checking important info.
          </p>
        </div>
      </div>

      {/* Sheets */}
      <ConversationList
        conversations={conversationItems}
        activeId={activeId ?? undefined}
        onSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        open={showConversationList}
        onOpenChange={setShowConversationList}
      />

      <AgentPicker
        agents={chatAgents}
        onSelect={handleAgentSelect}
        open={showAgentPicker}
        onOpenChange={setShowAgentPicker}
      />
    </div>
  );
}
