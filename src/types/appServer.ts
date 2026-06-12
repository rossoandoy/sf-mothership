/** Local AI Provider / App Server 連携の型定義 */

export type {
  AiProviderMode,
  AiProviderSettings,
} from '@/ai/core/types';

export interface AppServerSettings {
  enabled: boolean;
  baseUrl: string;
}

export const DEFAULT_APP_SERVER_URL = 'http://127.0.0.1:3847';
export const APP_SERVER_SETTINGS_KEY = 'app_server_settings';

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
  task: string;
  prompt: string;
  context: unknown;
  /** 診断結果や describe サマリ等、ユーザー確認済みデータ */
  data?: unknown;
}

export interface AppServerChatResponse {
  content: string;
  model?: string;
}
