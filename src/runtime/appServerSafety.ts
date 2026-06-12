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

type SanitizedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanitizedValue[]
  | { [key: string]: SanitizedValue };

function shouldDropKey(key: string): boolean {
  return FORBIDDEN_KEYS.some((f) => key.toLowerCase().includes(f.toLowerCase()));
}

function sanitizeValue(value: unknown): SanitizedValue {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === 'object' && value !== null) {
    return sanitizePayload(value as Record<string, unknown>);
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value == null
  ) {
    return value;
  }

  return String(value);
}

/**
 * 送信データから禁止キーを再帰的に除去する。
 */
export function sanitizePayload(data: Record<string, unknown>): Record<string, SanitizedValue> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (shouldDropKey(key)) {
      continue;
    }
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized as Record<string, SanitizedValue>;
}
