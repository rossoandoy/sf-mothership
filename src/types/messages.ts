import type { PageContext } from './context';

// Content Script → Service Worker
export interface PageContextUpdateMessage {
  type: 'PAGE_CONTEXT_UPDATE';
  payload: PageContext;
}

// Side Panel → Service Worker
export interface GetPageContextMessage {
  type: 'GET_PAGE_CONTEXT';
}

// Service Worker → Side Panel (broadcast)
export interface PageContextBroadcastMessage {
  type: 'PAGE_CONTEXT_BROADCAST';
  payload: PageContext | null;
}

// Popup → Service Worker
export interface OpenSidePanelMessage {
  type: 'OPEN_SIDE_PANEL';
}

// Side Panel → Service Worker: セッション取得
export interface GetSessionMessage {
  type: 'GET_SESSION';
  payload: { domain: string };
}

// セッション応答
export interface SessionResponse {
  sessionId: string;
  apiHostname: string;
}

// App Server リクエスト（Side Panel → Service Worker → localhost）
export interface AppServerRequestMessage {
  type: 'APP_SERVER_REQUEST';
  payload: {
    baseUrl: string;
    path: string;
    method: 'GET' | 'POST';
    body?: unknown;
  };
}

export type AppServerResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ExtensionMessage =
  | PageContextUpdateMessage
  | GetPageContextMessage
  | PageContextBroadcastMessage
  | OpenSidePanelMessage
  | GetSessionMessage
  | AppServerRequestMessage;
