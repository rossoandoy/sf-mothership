import { parseUrl, isSalesforceUrl } from '@/context/urlParser';
import { logger } from '@/shared/logger';
import { isExtensionContextValid, safeSendMessage } from '@/shared/extensionContext';
import type { PageContextUpdateMessage } from '@/types/messages';

let lastUrl = '';
let intervalId: ReturnType<typeof setInterval> | null = null;

function stopWatching(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function checkUrlChange(): void {
  if (!isExtensionContextValid()) {
    stopWatching();
    return;
  }

  const currentUrl = window.location.href;
  if (currentUrl === lastUrl) return;

  lastUrl = currentUrl;

  if (!isSalesforceUrl(currentUrl)) return;

  const context = parseUrl(currentUrl);

  const message: PageContextUpdateMessage = {
    type: 'PAGE_CONTEXT_UPDATE',
    payload: context,
  };

  const sent = safeSendMessage(message);
  if (!sent) {
    stopWatching();
    return;
  }

  logger.debug('コンテキスト送信', context.pageType, context.objectApiName);
}

checkUrlChange();
intervalId = setInterval(checkUrlChange, 500);

logger.debug('Content Script ロード完了');
