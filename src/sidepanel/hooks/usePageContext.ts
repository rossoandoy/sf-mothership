import { useEffect, useState } from 'react';
import type { PageContext } from '@/types/context';
import type { ExtensionMessage, GetPageContextMessage } from '@/types/messages';

/**
 * 現在のSalesforceページコンテキストを取得・監視するフック
 */
export function usePageContext(): PageContext | null {
  const [context, setContext] = useState<PageContext | null>(null);

  useEffect(() => {
    // 初回: Service Workerから現在のコンテキストを取得
    const request: GetPageContextMessage = { type: 'GET_PAGE_CONTEXT' };
    chrome.runtime.sendMessage(request).then((response: PageContext | null) => {
      if (response) {
        setContext(response);
      }
    }).catch(() => {
      // Service Workerが未起動の場合は無視
    });

    // リアルタイム更新: Service Workerからのブロードキャストを受信
    const listener = (message: ExtensionMessage) => {
      if (message.type === 'PAGE_CONTEXT_BROADCAST') {
        setContext(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return context;
}
