/**
 * SOQL クエリクライアント
 *
 * クエリ実行・ID検証パターンは SIR addon/data-export.js, addon/popup.js に基づく。
 * nextRecordsUrl 自動ページネーション対応
 * @see https://github.com/tprouvot/Salesforce-Inspector-reloaded
 */

import type { Result } from '@/shared/result';
import type { SoqlResponse } from '@/types/salesforce';
import { sfFetch, sfFetchAbsolute } from './client';

/**
 * SOQLクエリを実行する（1ページ分）
 */
export async function query<T>(
  apiHostname: string,
  sessionId: string,
  soql: string
): Promise<Result<SoqlResponse<T>>> {
  const encodedSoql = encodeURIComponent(soql);
  return sfFetch<SoqlResponse<T>>(apiHostname, sessionId, `/query?q=${encodedSoql}`);
}

/**
 * SOQLクエリを全ページ取得する（nextRecordsUrl 自動追跡）
 */
export async function queryAll<T>(
  apiHostname: string,
  sessionId: string,
  soql: string,
  options?: { maxRecords?: number }
): Promise<Result<SoqlResponse<T>>> {
  const firstResult = await query<T>(apiHostname, sessionId, soql);
  if (!firstResult.ok) return firstResult;

  const maxRecords = options?.maxRecords ?? 2000;
  const allRecords = [...firstResult.data.records];
  let nextUrl = firstResult.data.nextRecordsUrl;

  while (!firstResult.data.done && nextUrl && allRecords.length < maxRecords) {
    const pageResult = await sfFetchAbsolute<SoqlResponse<T>>(
      apiHostname,
      sessionId,
      nextUrl
    );
    if (!pageResult.ok) return pageResult;

    allRecords.push(...pageResult.data.records);
    nextUrl = pageResult.data.nextRecordsUrl;
    if (pageResult.data.done) break;
  }

  return {
    ok: true,
    data: {
      totalSize: firstResult.data.totalSize,
      done: allRecords.length >= maxRecords ? false : true,
      records: allRecords.slice(0, maxRecords),
    },
  };
}

/**
 * SOQLのWHERE句に安全に値を埋め込むためのエスケープ
 */
export function escapeSOQL(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * レコードIDが有効な形式（15桁または18桁のSalesforce ID）かどうかを検証する
 */
export function isValidRecordId(id: string): boolean {
  return /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(id);
}
