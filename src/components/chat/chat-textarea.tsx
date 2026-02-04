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
 * ChatGPT-style textarea input
 * 
 * Features:
 * - Auto-grows with content (up to maxHeight)
 * - Pill/rounded shape
 * - Dark background in dark mode
 * - Enter to send, Shift+Enter for newline
 * - 16px font (prevents iOS zoom on focus)
 */
export const ChatTextarea = forwardRef<HTMLTextAreaElement, ChatTextareaProps>(
  function ChatTextarea(
    {
      value,
      onChange,
      onSubmit,
      placeholder = 'Ask anything...',
      disabled = false,
      className,
      maxHeight = 200,
      minHeight = 24,
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
      textarea.style.height = 'auto';
      
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
          // Base styles - minimal, clean
          'w-full resize-none bg-transparent',
          'px-1 py-0',
          // Font: 16px minimum prevents iOS zoom on focus
          'text-base leading-normal',
          // No border, no outline - container handles this
          'border-none outline-none focus:outline-none focus:ring-0',
          // Placeholder styling
          'placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
          // Smooth height transition
          'transition-[height] duration-100 ease-out',
          // Scrollbar styling
          'scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent',
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
