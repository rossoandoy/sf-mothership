import { parseUrl, isSalesforceUrl } from '@/context/urlParser';
import { logger } from '@/shared/logger';
import type { PageContextUpdateMessage } from '@/types/messages';

// SPA URL変化検知（Lightning Experience はSPAのため、通常のナビゲーションイベントでは検知できない）
let lastUrl = '';

function checkUrlChange(): void {
  const currentUrl = window.location.href;
  if (currentUrl === lastUrl) return;

  lastUrl = currentUrl;

  if (!isSalesforceUrl(currentUrl)) return;

  const context = parseUrl(currentUrl);

  const message: PageContextUpdateMessage = {
    type: 'PAGE_CONTEXT_UPDATE',
    payload: context,
  };

  chrome.runtime.sendMessage(message).catch(() => {
    // Service Workerが再起動中の場合は無視（次のインターバルでリトライ）
  });

  logger.debug('コンテキスト送信', context.pageType, context.objectApiName);
}

// 初回実行
checkUrlChange();

// 500msインターバルでURL変化を監視
setInterval(checkUrlChange, 500);

logger.debug('Content Script ロード完了');
