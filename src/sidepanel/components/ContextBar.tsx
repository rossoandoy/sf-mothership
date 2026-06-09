import type { PageContext } from '@/types/context';

const PAGE_TYPE_LABELS: Record<string, string> = {
  recordPage: 'レコードページ',
  objectHome: 'オブジェクトホーム',
  setupPage: 'Setup',
  other: 'その他',
};

interface ContextBarProps {
  context: PageContext | null;
}

export function ContextBar({ context }: ContextBarProps) {
  if (!context) {
    return (
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs text-gray-400">
        Salesforce ページに移動してください
      </div>
    );
  }

  const parts: string[] = [];
  if (context.objectApiName) parts.push(context.objectApiName);
  if (context.recordId) {
    const shortId = context.recordId.length > 15
      ? `${context.recordId.slice(0, 8)}...`
      : context.recordId;
    parts.push(shortId);
  }
  parts.push(PAGE_TYPE_LABELS[context.pageType] ?? context.pageType);

  return (
    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2 min-h-[36px]">
      <span className="text-xs text-gray-700 font-mono truncate flex-1">
        {parts.join(' · ')}
      </span>
      {context.isSandboxDomain && (
        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded shrink-0">
          Sandbox
        </span>
      )}
    </div>
  );
}
