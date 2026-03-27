/**
 * Salesforce REST API クライアント
 *
 * Bearer token認証パターンは SIR addon/inspector.js sfConn.rest() に基づく。
 * UI側から直接fetchするパターンは sf-custom-config-tool lib/sf-api.ts に基づく。
 *
 * @see https://github.com/tprouvot/Salesforce-Inspector-reloaded
 */

import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import { logger } from '@/shared/logger';

// TODO: SIR の getLatestApiVersionFromOrg() パターンで動的取得に変更
// @see https://github.com/tprouvot/Salesforce-Inspector-reloaded/blob/master/addon/utils.js
const API_VERSION = 'v62.0';

/**
 * Salesforce REST APIへの認証付きfetch
 *
 * sessionIdとapiHostnameは呼び出し元が提供する
 * （Service Worker内でもSide Panel内でも動作する）
 */
export async function sfFetch<T>(
  apiHostname: string,
  sessionId: string,
  path: string,
  options: RequestInit = {}
): Promise<Result<T>> {
  const baseUrl = `https://${apiHostname}/services/data/${API_VERSION}`;
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      return handleHttpError(response);
    }

    // 204 No Content (DELETE成功等)
    if (response.status === 204) {
      return ok(null as T);
    }

    const data = await response.json() as T;
    return ok(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    logger.error('API呼出失敗', { apiHostname, path, error: message });
    return err(`ネットワークエラー: ${message}`);
  }
}

async function handleHttpError<T>(response: Response): Promise<Result<T>> {
  let detail = '';
  try {
    const body = await response.json() as Array<{ message?: string }>;
    if (Array.isArray(body) && body[0]?.message) {
      detail = body[0].message;
    }
  } catch {
    // JSONパース失敗は無視
  }

  switch (response.status) {
    case 401:
      return err('認証エラー: セッションが期限切れです。Salesforceに再ログインしてください。');
    case 403:
      return err(`権限エラー: この操作を実行する権限がありません。${detail ? ` (${detail})` : ''}`);
    case 404:
      return err(`リソースが見つかりません。${detail ? ` (${detail})` : ''}`);
    default:
      return err(`APIエラー (HTTP ${response.status}): ${detail || response.statusText}`);
  }
}
