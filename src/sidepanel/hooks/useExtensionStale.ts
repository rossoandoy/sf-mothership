import { useEffect, useState } from 'react';
import type { PageContext } from '@/types/context';
import { isExtensionContextValid } from '@/shared/extensionContext';

const STALE_DELAY_MS = 3000;

export type ExtensionStatus =
  | 'ready'
  | 'checking'
  | 'waitingForContext'
  | 'staleContentScript'
  | 'serviceWorkerError';

export interface ExtensionStatusInput {
  context: PageContext | null;
  hasValidExtensionContext: boolean;
  pageContextError: string | null;
  elapsedMs: number;
}

export function deriveExtensionStatus({
  context,
  hasValidExtensionContext,
  pageContextError,
  elapsedMs,
}: ExtensionStatusInput): ExtensionStatus {
  if (context) return 'ready';
  if (!hasValidExtensionContext) return 'staleContentScript';
  if (pageContextError) return 'serviceWorkerError';
  if (elapsedMs >= STALE_DELAY_MS) return 'waitingForContext';
  return 'checking';
}

/**
 * 拡張・Service Worker・ページコンテキストの状態を分類する
 */
export function useExtensionStatus(
  context: PageContext | null,
  pageContextError: string | null
): ExtensionStatus {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (context || pageContextError || !isExtensionContextValid()) {
      setElapsedMs(0);
      return;
    }

    const timer = setTimeout(() => {
      setElapsedMs(STALE_DELAY_MS);
    }, STALE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [context, pageContextError]);

  return deriveExtensionStatus({
    context,
    hasValidExtensionContext: isExtensionContextValid(),
    pageContextError,
    elapsedMs,
  });
}
