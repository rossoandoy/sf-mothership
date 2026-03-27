import type { Result } from './result';
import { ok } from './result';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * chrome.storage.localからキャッシュを取得する
 * TTL期限切れの場合はnullを返す
 */
export async function getCached<T>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    const entry = result[key] as CacheEntry<T> | undefined;

    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      // TTL期限切れ — 削除してnull返却
      await chrome.storage.local.remove(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * chrome.storage.localにキャッシュを保存する
 */
export async function setCache<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  await chrome.storage.local.set({ [key]: entry });
}

/**
 * 指定キーのキャッシュを削除する
 */
export async function invalidateCache(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

/**
 * キャッシュを活用してデータを取得する
 * キャッシュヒットならそのまま返し、ミスならfetcherを実行してキャッシュに保存
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<Result<T>>
): Promise<Result<T>> {
  const cached = await getCached<T>(key, ttlMs);
  if (cached != null) {
    return ok(cached);
  }

  const result = await fetcher();
  if (result.ok) {
    await setCache(key, result.data);
  }
  return result;
}
