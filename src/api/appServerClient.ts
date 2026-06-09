import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import type {
  AppServerChatRequest,
  AppServerChatResponse,
  AppServerHealthResponse,
} from '@/types/appServer';
import type { AppServerRequestMessage, AppServerResponse } from '@/types/messages';
import { getAppServerSettings } from './appServerSettings';

/**
 * Service Worker 経由でローカル App Server にリクエスト
 */
async function sendAppServerMessage<T>(
  path: string,
  method: 'GET' | 'POST',
  body?: unknown
): Promise<Result<T>> {
  const settings = await getAppServerSettings();

  if (!settings.enabled) {
    return err('App Server が無効です。Options画面で有効化してください。');
  }

  const message: AppServerRequestMessage = {
    type: 'APP_SERVER_REQUEST',
    payload: {
      baseUrl: settings.baseUrl,
      path,
      method,
      body,
    },
  };

  try {
    const response = await chrome.runtime.sendMessage(message) as AppServerResponse<T>;
    if (!response.ok) {
      return err(response.error);
    }
    return ok(response.data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    return err(`App Server 通信失敗: ${message}`);
  }
}

export async function checkAppServerHealth(): Promise<Result<AppServerHealthResponse>> {
  return sendAppServerMessage<AppServerHealthResponse>('/health', 'GET');
}

export async function sendAppServerChat(
  request: AppServerChatRequest
): Promise<Result<AppServerChatResponse>> {
  return sendAppServerMessage<AppServerChatResponse>('/v1/chat', 'POST', request);
}
