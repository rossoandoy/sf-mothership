import type { Result } from '@/shared/result';
import type { DescribeResult } from '@/types/salesforce';
import { sfFetch } from './client';
import { withCache } from '@/shared/cache';

const DESCRIBE_TTL_MS = 60 * 60 * 1000; // 1時間

/**
 * オブジェクトのDescribe情報を取得する（1時間キャッシュ付き）
 */
export async function describeObject(
  apiHostname: string,
  sessionId: string,
  objectApiName: string
): Promise<Result<DescribeResult>> {
  const cacheKey = `describe_${apiHostname}_${objectApiName}`;

  return withCache<DescribeResult>(
    cacheKey,
    DESCRIBE_TTL_MS,
    () => sfFetch<DescribeResult>(apiHostname, sessionId, `/sobjects/${objectApiName}/describe/`)
  );
}
