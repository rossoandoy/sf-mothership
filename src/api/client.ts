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

const API_VERSION_CACHE_KEY = 'sf_api_version';
const FALLBACK_API_VERSION = 'v62.0';

/**
 * Org ごとの API version をキャッシュから取得、なければ REST で動的取得
 */
export async function resolveApiVersion(
  apiHostname: string,
  sessionId: string
): Promise<string> {
  const cacheKey = `${API_VERSION_CACHE_KEY}_${apiHostname}`;
  try {
    const cached = await chrome.storage.local.get(cacheKey);
    const stored = cached[cacheKey] as string | undefined;
    if (stored) return stored;
  } catch {
    // キャッシュ読み取り失敗は無視
  }

  try {
    const response = await fetch(`https://${apiHostname}/services/data/`, {
      headers: {
        Authorization: `Bearer ${sessionId}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn('API version 取得失敗、フォールバック使用', { status: response.status });
      return FALLBACK_API_VERSION;
    }

    const versions = (await response.json()) as string[];
    if (!Array.isArray(versions) || versions.length === 0) {
      return FALLBACK_API_VERSION;
    }

    const latest = versions[versions.length - 1] ?? FALLBACK_API_VERSION;
    try {
      await chrome.storage.local.set({ [cacheKey]: latest });
    } catch {
      // キャッシュ保存失敗は無視
    }
    return latest;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    logger.warn('API version 取得エラー、フォールバック使用', { error: message });
    return FALLBACK_API_VERSION;
  }
}

/**
 * Salesforce REST APIへの認証付きfetch
 */
export async function sfFetch<T>(
  apiHostname: string,
  sessionId: string,
  path: string,
  options: RequestInit = {},
  apiVersion?: string
): Promise<Result<T>> {
  const version = apiVersion ?? await resolveApiVersion(apiHostname, sessionId);
  const baseUrl = `https://${apiHostname}/services/data/${version}`;
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

/**
 * nextRecordsUrl 等、フルパスでの fetch（ページネーション用）
 */
export async function sfFetchAbsolute<T>(
  apiHostname: string,
  sessionId: string,
  absolutePath: string
): Promise<Result<T>> {
  const url = `https://${apiHostname}${absolutePath}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${sessionId}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return handleHttpError(response);
    }

    const data = await response.json() as T;
    return ok(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
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
