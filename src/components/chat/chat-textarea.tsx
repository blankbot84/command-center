'use client';

import { useRef, useEffect, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ChatTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
  minHeight?: number;
}

/**
 * A polished chat textarea that mimics the UX of iMessage, Discord, ChatGPT, etc.
 * 
 * Features:
 * - Auto-grows with content (up to maxHeight)
 * - Smooth height transitions
 * - Enter to send, Shift+Enter for newline
 * - 16px font (prevents iOS zoom on focus)
 * - Proper focus states
 * - Mobile keyboard handling
 */
export const ChatTextarea = forwardRef<HTMLTextAreaElement, ChatTextareaProps>(
  function ChatTextarea(
    {
      value,
      onChange,
      onSubmit,
      placeholder = 'Message...',
      disabled = false,
      className,
      maxHeight = 200,
      minHeight = 44,
    },
    forwardedRef
  ) {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize textarea to fit content
    const adjustHeight = useCallback(() => {
      const textarea = ref.current;
      if (!textarea) return;

      // Reset to min height to get accurate scrollHeight
      textarea.style.height = `${minHeight}px`;
      
      // Calculate new height based on content
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      
      textarea.style.height = `${newHeight}px`;
      
      // Enable scrolling if content exceeds max height
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [ref, minHeight, maxHeight]);

    // Adjust height whenever value changes
    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter without shift = submit
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!disabled && value.trim()) {
            onSubmit();
          }
        }
        // Shift+Enter = newline (default behavior, no prevention needed)
      },
      [disabled, value, onSubmit]
    );

    // Handle input changes
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    // Handle composition (for IME input on mobile/international keyboards)
    const isComposingRef = useRef(false);

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
      isComposingRef.current = false;
    }, []);

    return (
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          // Base styles
          'w-full resize-none rounded-lg border bg-background px-4 py-3',
          // Font: 16px minimum prevents iOS zoom on focus
          'text-base leading-relaxed',
          // Border and focus states
          'border-input',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'focus:border-transparent',
          // Placeholder styling
          'placeholder:text-muted-foreground placeholder:transition-opacity',
          'focus:placeholder:opacity-70',
          // Smooth height transition
          'transition-[height,box-shadow,border-color] duration-150 ease-out',
          // Scrollbar styling
          'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Touch improvements
          'touch-manipulation',
          className
        )}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
      />
    );
  }
);
