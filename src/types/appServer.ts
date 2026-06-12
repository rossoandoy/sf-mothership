/** Codex App Server 連携の型定義 */

export interface AppServerSettings {
  enabled: boolean;
  baseUrl: string;
}

export const DEFAULT_APP_SERVER_URL = 'http://127.0.0.1:3847';
export const APP_SERVER_SETTINGS_KEY = 'app_server_settings';

export type AiProviderMode = 'app-server-only' | 'chrome-prompt-only' | 'hybrid';

export interface AiProviderSettings {
  mode: AiProviderMode;
  allowChromePromptInTools: boolean;
}

export const AI_PROVIDER_SETTINGS_KEY = 'ai_provider_settings';

export interface AppServerHealthResponse {
  status: 'ok' | 'error';
  version?: string;
  message?: string;
}

/** 外部送信を許可する最小コンテキスト（sessionId 禁止） */
export interface SafeContextPayload {
  orgDomain: string;
  objectApiName: string | null;
  recordId: string | null;
  pageType: string;
  isSandbox: boolean;
}

export interface AppServerChatRequest {
  task: 'tool-definition' | 'diagnostic-explain' | 'report-analyze';
  prompt: string;
  context: SafeContextPayload;
  /** 診断結果や describe サマリ等、ユーザー確認済みデータ */
  data?: Record<string, unknown>;
}

export interface AppServerChatResponse {
  content: string;
  model?: string;
}
