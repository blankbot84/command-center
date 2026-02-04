/**
 * Clawdbot Gateway Integration
 * 
 * Types and utilities for communicating with the Clawdbot gateway SSE stream.
 * The gateway proxies conversations to Claude and streams responses back.
 * 
 * ## SSE Stream Format
 * 
 * The gateway sends Server-Sent Events (SSE) with the following event types:
 * 
 * ### Event: `message`
 * Standard text content from the assistant.
 * ```
 * event: message
 * data: {"type":"text","content":"Hello! How can I help..."}
 * ```
 * 
 * ### Event: `tool_use`
 * Agent is invoking a tool. Shows tool name and input parameters.
 * ```
 * event: tool_use
 * data: {"type":"tool_use","name":"web_search","input":{"query":"weather today"}}
 * ```
 * 
 * ### Event: `tool_result`
 * Result returned from a tool call.
 * ```
 * event: tool_result
 * data: {"type":"tool_result","name":"web_search","result":"..."}
 * ```
 * 
 * ### Event: `thinking`
 * Extended thinking content (when reasoning is enabled).
 * ```
 * event: thinking
 * data: {"type":"thinking","content":"Let me analyze..."}
 * ```
 * 
 * ### Event: `error`
 * Error occurred during processing.
 * ```
 * event: error
 * data: {"type":"error","message":"Rate limit exceeded","code":"rate_limit"}
 * ```
 * 
 * ### Event: `done`
 * Stream has completed.
 * ```
 * event: done
 * data: {"type":"done"}
 * ```
 * 
 * @see https://github.com/blankbot84/command-center/issues/45
 * @see https://github.com/blankbot84/command-center/issues/46
 */

// ─────────────────────────────────────────────────────────────
// SSE Event Types
// ─────────────────────────────────────────────────────────────

export type SSEEventType = 
  | 'message' 
  | 'tool_use' 
  | 'tool_result' 
  | 'thinking' 
  | 'error' 
  | 'done';

/** Text content from the assistant */
export interface MessageEvent {
  type: 'message';
  content: string;
  /** Optional: incremental delta (for streaming) */
  delta?: string;
}

/** Agent is invoking a tool */
export interface ToolUseEvent {
  type: 'tool_use';
  /** Tool name (e.g., "web_search", "Read", "exec") */
  name: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
  /** Unique ID for this tool call */
  id?: string;
}

/** Result returned from a tool call */
export interface ToolResultEvent {
  type: 'tool_result';
  /** Tool name that produced this result */
  name: string;
  /** The result content (may be truncated for display) */
  result: string;
  /** Reference to the tool_use id */
  toolUseId?: string;
  /** Whether the result was truncated */
  truncated?: boolean;
}

/** Extended thinking content */
export interface ThinkingEvent {
  type: 'thinking';
  content: string;
  /** Optional: incremental delta */
  delta?: string;
}

/** Error during processing */
export interface ErrorEvent {
  type: 'error';
  message: string;
  code?: string;
  /** Whether the error is recoverable */
  recoverable?: boolean;
}

/** Stream completed */
export interface DoneEvent {
  type: 'done';
  /** Optional usage stats */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

/** Union of all SSE event data types */
export type SSEEventData = 
  | MessageEvent 
  | ToolUseEvent 
  | ToolResultEvent 
  | ThinkingEvent 
  | ErrorEvent 
  | DoneEvent;

// ─────────────────────────────────────────────────────────────
// Chat Message Types
// ─────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

/** A message in the chat history */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  /** Tool calls made during this message (assistant only) */
  toolCalls?: ToolCall[];
  /** Whether this message is still streaming */
  isStreaming?: boolean;
}

/** A tool call with its result */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  /** Display status for UI */
  status: 'pending' | 'running' | 'complete' | 'error';
}

// ─────────────────────────────────────────────────────────────
// Gateway Configuration
// ─────────────────────────────────────────────────────────────

export interface GatewayConfig {
  /** Base URL for the Clawdbot gateway */
  url: string;
  /** Optional: authentication token */
  token?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

/** Default configuration */
export const DEFAULT_GATEWAY_CONFIG: Partial<GatewayConfig> = {
  timeout: 30000,
};

/**
 * Get gateway configuration from environment
 */
export function getGatewayConfig(): GatewayConfig | null {
  const url = process.env.CLAWDBOT_GATEWAY_URL;
  if (!url) return null;
  
  return {
    url,
    token: process.env.CLAWDBOT_GATEWAY_TOKEN,
    ...DEFAULT_GATEWAY_CONFIG,
  };
}

// ─────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  healthy: boolean;
  /** Response time in ms */
  responseTime?: number;
  /** Error message if unhealthy */
  error?: string;
  /** Gateway version if available */
  version?: string;
  /** Timestamp of the check */
  checkedAt: string;
}

/**
 * Check if the Clawdbot gateway is healthy and reachable.
 * 
 * @param config - Gateway configuration (uses env if not provided)
 * @returns Health check result
 */
export async function checkGatewayHealth(
  config?: GatewayConfig
): Promise<HealthCheckResult> {
  const cfg = config ?? getGatewayConfig();
  const checkedAt = new Date().toISOString();
  
  if (!cfg?.url) {
    return {
      healthy: false,
      error: 'CLAWDBOT_GATEWAY_URL not configured',
      checkedAt,
    };
  }
  
  const startTime = Date.now();
  
  try {
    // The gateway typically has a /health or /status endpoint
    const healthUrl = new URL('/health', cfg.url).toString();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(), 
      cfg.timeout ?? 5000
    );
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        healthy: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        checkedAt,
      };
    }
    
    // Try to parse version from response
    let version: string | undefined;
    try {
      const data = await response.json();
      version = data.version ?? data.v;
    } catch {
      // Response may not be JSON, that's okay
    }
    
    return {
      healthy: true,
      responseTime,
      version,
      checkedAt,
    };
  } catch (err) {
    const responseTime = Date.now() - startTime;
    const error = err instanceof Error ? err.message : 'Unknown error';
    
    return {
      healthy: false,
      responseTime,
      error: error.includes('abort') ? 'Request timeout' : error,
      checkedAt,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// SSE Parsing Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Parse a raw SSE line into event type and data.
 * 
 * @param line - Raw SSE line (e.g., "data: {...}" or "event: message")
 * @returns Parsed components or null if not a valid SSE line
 */
export function parseSSELine(line: string): { 
  field: 'event' | 'data' | 'id' | 'retry'; 
  value: string 
} | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(':')) return null; // Comment or empty
  
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex === -1) return null;
  
  const field = trimmed.slice(0, colonIndex) as 'event' | 'data' | 'id' | 'retry';
  // Value starts after colon, skip optional leading space
  let value = trimmed.slice(colonIndex + 1);
  if (value.startsWith(' ')) value = value.slice(1);
  
  return { field, value };
}

/**
 * Parse SSE event data JSON into typed event.
 * 
 * @param json - Raw JSON string from SSE data field
 * @returns Typed SSE event data or null if invalid
 */
export function parseSSEEventData(json: string): SSEEventData | null {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data.type !== 'string') return null;
    return data as SSEEventData;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Display Helpers
// ─────────────────────────────────────────────────────────────

/** Human-readable tool names for display */
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  web_search: 'Searching the web',
  web_fetch: 'Fetching page',
  Read: 'Reading file',
  Write: 'Writing file',
  Edit: 'Editing file',
  exec: 'Running command',
  browser: 'Using browser',
  image: 'Analyzing image',
  message: 'Sending message',
  nodes: 'Checking nodes',
  tts: 'Generating speech',
};

/**
 * Get a human-readable description for a tool call.
 * 
 * @param name - Tool name
 * @param input - Tool input parameters
 * @returns Human-readable string for display
 */
export function getToolDisplayText(
  name: string, 
  input?: Record<string, unknown>
): string {
  const base = TOOL_DISPLAY_NAMES[name] ?? `Using ${name}`;
  
  // Add context from input if available
  if (!input) return base;
  
  switch (name) {
    case 'web_search':
      return input.query ? `Searching: "${input.query}"` : base;
    case 'web_fetch':
      return input.url ? `Fetching: ${input.url}` : base;
    case 'Read':
      return input.path ? `Reading: ${input.path}` : base;
    case 'Write':
      return input.path ? `Writing: ${input.path}` : base;
    case 'Edit':
      return input.path ? `Editing: ${input.path}` : base;
    case 'exec':
      return input.command ? `Running: ${truncate(String(input.command), 50)}` : base;
    default:
      return base;
  }
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

// ─────────────────────────────────────────────────────────────
// ID Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate a unique message ID.
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a unique tool call ID.
 */
export function generateToolCallId(): string {
  return `tc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
