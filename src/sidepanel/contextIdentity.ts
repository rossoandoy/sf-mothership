import type { PageContext } from '@/types/context';

export function buildContextIdentity(context: PageContext | null): string | null {
  if (!context) return null;

  return [
    context.orgDomain,
    context.pageType,
    context.objectApiName ?? '',
    context.recordId ?? '',
    context.url,
  ].join('|');
}
