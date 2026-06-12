import { logger } from '@/shared/logger';
import { updateTabContext, getActiveTabContext, getTabContext } from './contextManager';
import { getSessionId } from '@/api/auth';
import { isLocalhostUrl } from '@/api/appServerSettings';
import type { ExtensionMessage, PageContextBroadcastMessage, AppServerResponse } from '@/types/messages';

// Side Panel をアクションクリックで開く
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

const APP_SERVER_ALLOWED_PATHS = new Set(['/health', '/v1/chat']);
const APP_SERVER_TIMEOUT_MS = 30_000;
const APP_SERVER_MAX_BODY_BYTES = 64 * 1024;

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

      case 'APP_SERVER_REQUEST': {
        proxyAppServerRequest(message.payload).then((result) => {
          sendResponse(result);
        });
        return true;
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

/**
 * ローカル App Server へのプロキシ（CORS 回避）
 * localhost / 127.0.0.1 のみ許可
 */
async function proxyAppServerRequest<T>(payload: {
  baseUrl: string;
  path: string;
  method: 'GET' | 'POST';
  body?: unknown;
}): Promise<AppServerResponse<T>> {
  if (!isLocalhostUrl(payload.baseUrl)) {
    return { ok: false, error: 'App Server URL は localhost / 127.0.0.1 のみ許可されています' };
  }

  if (!APP_SERVER_ALLOWED_PATHS.has(payload.path)) {
    return { ok: false, error: `App Server path は ${Array.from(APP_SERVER_ALLOWED_PATHS).join(', ')} のみ許可されています` };
  }

  const url = `${payload.baseUrl.replace(/\/$/, '')}${payload.path}`;
  const bodyText = payload.method === 'POST' && payload.body != null
    ? JSON.stringify(payload.body)
    : undefined;

  if (bodyText && new TextEncoder().encode(bodyText).byteLength > APP_SERVER_MAX_BODY_BYTES) {
    return { ok: false, error: 'App Server へ送信するデータが大きすぎます' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_SERVER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: payload.method,
      headers: payload.method === 'POST'
        ? { 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Accept: 'application/json' },
      body: bodyText,
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        const errBody = await response.json() as { message?: string; error?: string };
        detail = errBody.message ?? errBody.error ?? '';
      } catch {
        detail = response.statusText;
      }
      return { ok: false, error: `App Server エラー (HTTP ${response.status}): ${detail}` };
    }

    const data = await response.json() as T;
    return { ok: true, data };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    logger.warn('App Server プロキシ失敗', { url, error: message });
    return {
      ok: false,
      error: `App Server に接続できません。サーバーが起動しているか確認してください。 (${message})`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

logger.info('Service Worker 起動完了');
