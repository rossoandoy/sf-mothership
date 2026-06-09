import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import type { SafeContextPayload } from '@/types/appServer';

const FORBIDDEN_KEYS = ['sessionId', 'sid', 'password', 'token', 'authorization'];

/**
 * App Server へ送信可能な最小コンテキストを構築する。
 * sessionId 等の機密情報は含めない。
 */
export function buildSafeContext(
  pageContext: PageContext,
  orgInfo: OrgInfo
): SafeContextPayload {
  return {
    orgDomain: pageContext.orgDomain,
    objectApiName: pageContext.objectApiName,
    recordId: pageContext.recordId,
    pageType: pageContext.pageType,
    isSandbox: orgInfo.isSandbox,
  };
}

/**
 * 送信データから禁止キーを除去する（浅いコピー）
 */
export function sanitizePayload(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (FORBIDDEN_KEYS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
