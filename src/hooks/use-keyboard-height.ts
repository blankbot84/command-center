/**
 * use-keyboard-height.ts - Mobile keyboard height detection
 * 
 * Uses the visualViewport API to detect when the virtual keyboard
 * appears/disappears on mobile devices.
 * 
 * USAGE:
 * ```tsx
 * const keyboardHeight = useKeyboardHeight()
 * 
 * // In styles or inline:
 * style={{ paddingBottom: keyboardHeight }}
 * 
 * // Or use the CSS variable set by this hook:
 * // height: calc(100dvh - var(--keyboard-height, 0px))
 * ```
 * 
 * REQUIREMENTS (Issue #43):
 * - visualViewport API for proper keyboard handling
 * - Use 100dvh not 100vh for Safari compatibility
 * - Sets CSS variable for easy consumption
 */

import { useEffect, useState, useCallback } from 'react'

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const updateKeyboardHeight = useCallback(() => {
    if (typeof window === 'undefined') return

    const viewport = window.visualViewport
    if (!viewport) {
      setKeyboardHeight(0)
      return
    }

    // Calculate keyboard height as difference between window height and viewport height
    // This works because visualViewport shrinks when keyboard appears
    const windowHeight = window.innerHeight
    const viewportHeight = viewport.height

    // Account for viewport offset (when keyboard pushes content up)
    const calculatedHeight = Math.max(0, windowHeight - viewportHeight - viewport.offsetTop)
    
    // Round to avoid subpixel issues
    const roundedHeight = Math.round(calculatedHeight)

    setKeyboardHeight(roundedHeight)

    // Also set as CSS variable for easy consumption in CSS
    document.documentElement.style.setProperty(
      '--keyboard-height',
      `${roundedHeight}px`
    )
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const viewport = window.visualViewport
    if (!viewport) return

    // Initial calculation
    updateKeyboardHeight()

    // Listen for viewport changes (keyboard show/hide, resize, scroll)
    viewport.addEventListener('resize', updateKeyboardHeight)
    viewport.addEventListener('scroll', updateKeyboardHeight)

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateKeyboardHeight)

    return () => {
      viewport.removeEventListener('resize', updateKeyboardHeight)
      viewport.removeEventListener('scroll', updateKeyboardHeight)
      window.removeEventListener('resize', updateKeyboardHeight)
      
      // Reset CSS variable on cleanup
      document.documentElement.style.removeProperty('--keyboard-height')
    }
  }, [updateKeyboardHeight])

  return keyboardHeight
}

/**
 * Hook variant that returns an object with more details
 */
export function useKeyboardState() {
  const [state, setState] = useState({
    height: 0,
    isOpen: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return

    const viewport = window.visualViewport
    if (!viewport) {
      setState({ height: 0, isOpen: false, viewportHeight: window.innerHeight })
      return
    }

    const windowHeight = window.innerHeight
    const viewportHeight = viewport.height
    const calculatedHeight = Math.max(0, windowHeight - viewportHeight - viewport.offsetTop)
    const roundedHeight = Math.round(calculatedHeight)

    // Consider keyboard "open" if height > threshold (100px accounts for nav bars)
    const isOpen = roundedHeight > 100

    setState({
      height: roundedHeight,
      isOpen,
      viewportHeight: Math.round(viewportHeight),
    })

    document.documentElement.style.setProperty('--keyboard-height', `${roundedHeight}px`)
    document.documentElement.style.setProperty('--viewport-height', `${Math.round(viewportHeight)}px`)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const viewport = window.visualViewport
    if (!viewport) return

    updateState()

    viewport.addEventListener('resize', updateState)
    viewport.addEventListener('scroll', updateState)
    window.addEventListener('resize', updateState)

    return () => {
      viewport.removeEventListener('resize', updateState)
      viewport.removeEventListener('scroll', updateState)
      window.removeEventListener('resize', updateState)
      document.documentElement.style.removeProperty('--keyboard-height')
      document.documentElement.style.removeProperty('--viewport-height')
    }
  }, [updateState])

  return state
}
