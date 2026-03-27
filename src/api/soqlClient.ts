import type { Result } from '@/shared/result';
import type { SoqlResponse } from '@/types/salesforce';
import { sfFetch } from './client';

/**
 * SOQLクエリを実行する
 * SOQLインジェクション防止: ユーザー入力を直接連結しないこと
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
