/**
 * Anthropic Messages API SSE streaming client.
 *
 * Development: requests go to /api/ai-chat (local Vite proxy → Anthropic API)
 * Production:  requests go to Supabase Edge Function → Anthropic API
 *
 * Both return Anthropic SSE event format:
 *   message_start        → message metadata
 *   content_block_start  → new text or tool_use block
 *   content_block_delta  → text_delta or input_json_delta
 *   content_block_stop   → block finished (flush tool calls here)
 *   message_delta        → stop_reason, usage
 *   message_stop         → stream complete
 *   error                → API error
 */

const CHAT_URL = import.meta.env.DEV
  ? '/api/ai-chat'
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

type Msg = { role: 'user' | 'assistant'; content: string };

/** Accumulator for a single tool_use content block */
interface ToolUseBlock {
  name: string;
  inputJson: string;
}

export function streamChat({
  messages,
  walletContext,
  onDelta,
  onToolCall,
  onDone,
  onError,
}: {
  messages: Msg[];
  walletContext: Record<string, unknown>;
  onDelta: (text: string) => void;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onDone: () => void;
  onError: (err: string) => void;
}): AbortController {
  const abortController = new AbortController();

  (async () => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // Only add Supabase auth header in production (local proxy doesn't need it)
    if (!import.meta.env.DEV) {
      headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
    }

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, walletContext }),
      signal: abortController.signal,
    });

    if (resp.status === 429) {
      onError('请求过于频繁，请稍后再试');
      return;
    }
    if (resp.status === 401) {
      onError('API Key 无效，请检查配置');
      return;
    }
    if (!resp.ok || !resp.body) {
      // Try to extract error message from JSON response
      try {
        const errBody = await resp.json();
        onError(errBody.error || 'AI 服务暂时不可用');
      } catch {
        onError('AI 服务暂时不可用');
      }
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Track tool_use content blocks by their stream index
    const toolBlocks: Map<number, ToolUseBlock> = new Map();

    // SSE parser state
    let currentEventType = '';
    let currentDataLines: string[] = [];

    /**
     * Process a complete SSE event (triggered when we encounter a blank line).
     */
    const processEvent = () => {
      if (currentDataLines.length === 0) {
        currentEventType = '';
        return;
      }

      const dataStr = currentDataLines.join('\n');
      currentDataLines = [];
      const eventType = currentEventType;
      currentEventType = '';

      try {
        const data = JSON.parse(dataStr);

        switch (eventType) {
          case 'content_block_start': {
            const block = data.content_block;
            if (block?.type === 'tool_use') {
              toolBlocks.set(data.index, {
                name: block.name,
                inputJson: '',
              });
            }
            break;
          }

          case 'content_block_delta': {
            const delta = data.delta;
            if (delta?.type === 'text_delta' && delta.text) {
              onDelta(delta.text);
            } else if (delta?.type === 'input_json_delta' && delta.partial_json !== undefined) {
              const toolBlock = toolBlocks.get(data.index);
              if (toolBlock) {
                toolBlock.inputJson += delta.partial_json;
              }
            }
            break;
          }

          case 'content_block_stop': {
            const toolBlock = toolBlocks.get(data.index);
            if (toolBlock) {
              try {
                const args = JSON.parse(toolBlock.inputJson || '{}');
                onToolCall?.(toolBlock.name, args);
              } catch {
                // Partial JSON couldn't be parsed — skip this tool call
              }
              toolBlocks.delete(data.index);
            }
            break;
          }

          case 'message_stop': {
            // Stream complete — handled by reader.read() returning done
            break;
          }

          case 'error': {
            const msg = data.error?.message || 'AI 服务出错';
            onError(msg);
            return;
          }

          // message_start, message_delta, ping — no action needed
          default:
            break;
        }
      } catch {
        // JSON parse failure — skip this event
      }
    };

    // Read and parse the SSE stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process line by line
      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const rawLine = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

        if (line === '') {
          // Blank line = end of SSE event block → process accumulated event
          processEvent();
        } else if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          currentDataLines.push(line.slice(6));
        }
        // Skip comment lines (starting with ':') and other lines
      }
    }

    // Flush any remaining event in the buffer
    if (currentDataLines.length > 0) {
      processEvent();
    }

    onDone();
  } catch (e) {
    if (abortController.signal.aborted) {
      onDone();
      return;
    }
    onError(e instanceof Error ? e.message : '网络错误');
  }
  })();

  return abortController;
}
