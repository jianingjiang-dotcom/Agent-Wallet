import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Smooth typewriter text reveal hook.
 *
 * Instead of showing SSE chunks all at once, this hook buffers the target
 * content and reveals it character-by-character using requestAnimationFrame
 * with an adaptive speed algorithm (exponential decay catch-up).
 *
 * The result is a silky streaming effect regardless of SSE chunk timing.
 *
 * @param targetContent - The full text received so far (grows with each SSE chunk)
 * @param isStreaming   - Whether the stream is still active
 * @returns displayedContent - A smoothly-revealed prefix of targetContent
 */

// --- Tuning constants ---
// Base reveal speed in characters per second (floor speed when buffer is shallow)
const BASE_CPS = 30;
// Fraction of remaining "behind" distance consumed per frame (exponential decay)
const CATCH_UP_FACTOR = 0.12;
// Cap delta-time to prevent massive jumps after tab-switch / background
const MAX_DT = 0.1;

export function useStreamingText(
  targetContent: string,
  isStreaming: boolean,
): string {
  const [displayed, setDisplayed] = useState(targetContent);

  // Refs to avoid stale closures in the rAF loop
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const targetRef = useRef(targetContent);
  const streamingRef = useRef(isStreaming);

  // Keep refs in sync on every render
  targetRef.current = targetContent;
  streamingRef.current = isStreaming;

  // --- Stable tick function stored in a ref ---
  const tickRef = useRef<() => void>();
  tickRef.current = () => {
    const now = performance.now();
    const dt = lastTimeRef.current
      ? Math.min((now - lastTimeRef.current) / 1000, MAX_DT)
      : 1 / 60;
    lastTimeRef.current = now;

    const target = targetRef.current;
    const behind = target.length - posRef.current;

    if (behind <= 0) {
      // Caught up with target — pause the loop, wait for more content
      rafRef.current = 0;
      return;
    }

    // Adaptive step: base speed + exponential catch-up
    const baseStep = BASE_CPS * dt;
    const catchUpStep = behind * CATCH_UP_FACTOR;
    const step = Math.max(1, Math.ceil(baseStep + catchUpStep));

    posRef.current = Math.min(posRef.current + step, target.length);
    setDisplayed(target.slice(0, posRef.current));

    // Continue loop only while streaming
    if (streamingRef.current) {
      rafRef.current = requestAnimationFrame(() => tickRef.current!());
    } else {
      rafRef.current = 0;
    }
  };

  const startLoop = useCallback(() => {
    if (rafRef.current) return; // already running
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(() => tickRef.current!());
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  // When streaming starts, kick off the animation loop
  useEffect(() => {
    if (isStreaming) {
      startLoop();
    }
    return stopLoop;
  }, [isStreaming, startLoop, stopLoop]);

  // When new content arrives and the loop has paused (caught up), restart it
  useEffect(() => {
    if (isStreaming && targetContent.length > posRef.current && !rafRef.current) {
      startLoop();
    }
  }, [targetContent, isStreaming, startLoop]);

  // When streaming ends, flush all remaining content immediately
  useEffect(() => {
    if (!isStreaming) {
      stopLoop();
      posRef.current = targetContent.length;
      setDisplayed(targetContent);
    }
  }, [isStreaming, targetContent, stopLoop]);

  return displayed;
}
