/**
 * use-auto-scroll.ts - Smart auto-scroll behavior for chat UIs
 * 
 * Implements "stick to bottom" behavior that:
 * - Auto-scrolls to new content when user is at/near bottom
 * - Allows manual scroll up without interruption
 * - Re-enables auto-scroll when user scrolls back to bottom
 * 
 * USAGE:
 * ```tsx
 * const { ref, scrollToBottom, isAtBottom } = useAutoScroll<HTMLDivElement>()
 * 
 * return (
 *   <div ref={ref} className="overflow-y-auto">
 *     {messages.map(...)}
 *   </div>
 * )
 * ```
 * 
 * REQUIREMENTS (Issue #44):
 * - Smart auto-scroll (stick to bottom, allow manual scroll up)
 * - overscroll-contain to prevent pull-to-refresh interference
 */

import { useRef, useEffect, useCallback, useState } from 'react'

interface UseAutoScrollOptions {
  /** Threshold in pixels to consider "at bottom" (default: 100) */
  threshold?: number
  /** Enable smooth scrolling animation (default: true) */
  smooth?: boolean
  /** Dependency array to trigger scroll check (e.g., [messages.length]) */
  deps?: unknown[]
}

interface UseAutoScrollReturn<T extends HTMLElement> {
  /** Ref to attach to the scrollable container */
  ref: React.RefObject<T | null>
  /** Whether the user is currently at/near the bottom */
  isAtBottom: boolean
  /** Whether auto-scroll is currently active */
  isAutoScrollEnabled: boolean
  /** Programmatically scroll to bottom */
  scrollToBottom: (options?: { smooth?: boolean }) => void
  /** Programmatically enable/disable auto-scroll */
  setAutoScrollEnabled: (enabled: boolean) => void
}

export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn<T> {
  const { threshold = 100, smooth = true, deps = [] } = options

  const ref = useRef<T>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isAutoScrollEnabled, setAutoScrollEnabled] = useState(true)
  
  // Track if user manually scrolled up
  const userScrolledRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  const checkIfAtBottom = useCallback(() => {
    const element = ref.current
    if (!element) return true

    const { scrollTop, scrollHeight, clientHeight } = element
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    return distanceFromBottom <= threshold
  }, [threshold])

  const scrollToBottom = useCallback((scrollOptions?: { smooth?: boolean }) => {
    const element = ref.current
    if (!element) return

    const shouldSmooth = scrollOptions?.smooth ?? smooth

    element.scrollTo({
      top: element.scrollHeight,
      behavior: shouldSmooth ? 'smooth' : 'instant',
    })

    // Reset user scroll flag when programmatically scrolling to bottom
    userScrolledRef.current = false
    setIsAtBottom(true)
    setAutoScrollEnabled(true)
  }, [smooth])

  // Handle scroll events
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleScroll = () => {
      const currentScrollTop = element.scrollTop
      const atBottom = checkIfAtBottom()

      // Detect if user is scrolling up
      if (currentScrollTop < lastScrollTopRef.current && !atBottom) {
        userScrolledRef.current = true
        setAutoScrollEnabled(false)
      }

      // Re-enable auto-scroll when user reaches bottom
      if (atBottom && userScrolledRef.current) {
        userScrolledRef.current = false
        setAutoScrollEnabled(true)
      }

      lastScrollTopRef.current = currentScrollTop
      setIsAtBottom(atBottom)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [checkIfAtBottom])

  // Auto-scroll when deps change and auto-scroll is enabled
  useEffect(() => {
    if (!isAutoScrollEnabled) return

    const element = ref.current
    if (!element) return

    // Small delay to ensure content is rendered
    requestAnimationFrame(() => {
      if (checkIfAtBottom() || isAutoScrollEnabled) {
        scrollToBottom({ smooth })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    ref,
    isAtBottom,
    isAutoScrollEnabled,
    scrollToBottom,
    setAutoScrollEnabled,
  }
}

/**
 * Simpler hook for basic scroll-to-bottom functionality
 */
export function useScrollToBottom<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    const element = ref.current
    if (!element) return

    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }, [])

  return { ref, scrollToBottom }
}
