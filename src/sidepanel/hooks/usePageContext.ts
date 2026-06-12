import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageContext } from '@/types/context';
import type { ExtensionMessage, GetPageContextMessage } from '@/types/messages';

export interface PageContextState {
  context: PageContext | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * 現在のSalesforceページコンテキストを取得・監視するフック
 */
export function usePageContext(): PageContextState {
  const [context, setContext] = useState<PageContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const retry = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    // 初回・再取得: Service Workerから現在のコンテキストを取得
    const request: GetPageContextMessage = { type: 'GET_PAGE_CONTEXT' };
    chrome.runtime.sendMessage(request).then((response: PageContext | null) => {
      if (requestId !== requestIdRef.current) return;
      setContext(response ?? null);
      setLoading(false);
    }).catch((err: unknown) => {
      if (requestId !== requestIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Service Worker から応答がありません';
      setError(message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    retry();

    // リアルタイム更新: Service Workerからのブロードキャストを受信
    const listener = (message: ExtensionMessage) => {
      if (message.type === 'PAGE_CONTEXT_BROADCAST') {
        setContext(message.payload);
        setError(null);
        setLoading(false);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [retry]);

  return { context, loading, error, retry };
}
