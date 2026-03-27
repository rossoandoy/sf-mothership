import { logger } from '@/shared/logger';
import { updateTabContext, getActiveTabContext, getTabContext } from './contextManager';
import { getSessionId } from '@/api/auth';
import type { ExtensionMessage, PageContextBroadcastMessage } from '@/types/messages';

// Side Panel をアクションクリックで開く
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// メッセージリスナー
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    switch (message.type) {
      case 'PAGE_CONTEXT_UPDATE': {
        const tabId = sender.tab?.id;
        if (tabId != null) {
          updateTabContext(tabId, message.payload);
          // Side Panelにブロードキャスト
          const broadcast: PageContextBroadcastMessage = {
            type: 'PAGE_CONTEXT_BROADCAST',
            payload: message.payload,
          };
          chrome.runtime.sendMessage(broadcast).catch(() => {
            // Side Panelが開いていない場合は無視
          });
        }
        return false;
      }

      case 'GET_PAGE_CONTEXT': {
        getActiveTabContext().then((context) => {
          sendResponse(context);
        });
        return true; // 非同期応答
      }

      case 'OPEN_SIDE_PANEL': {
        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
          if (tab?.id) {
            chrome.sidePanel.open({ tabId: tab.id });
          }
        });
        return false;
      }

      case 'GET_SESSION': {
        // セッション取得のみ — APIコールはSide Panelから直接行う
        getSessionId(message.payload.domain).then((result) => {
          sendResponse(result);
        });
        return true; // 非同期応答
      }

      default:
        return false;
    }
  }
);

// タブがアクティブになったときにSide Panelにコンテキストをブロードキャスト
chrome.tabs.onActivated.addListener((activeInfo) => {
  const context = getTabContext(activeInfo.tabId);
  const broadcast: PageContextBroadcastMessage = {
    type: 'PAGE_CONTEXT_BROADCAST',
    payload: context,
  };
  chrome.runtime.sendMessage(broadcast).catch(() => {
    // Side Panelが開いていない場合は無視
  });
});

logger.info('Service Worker 起動完了');
