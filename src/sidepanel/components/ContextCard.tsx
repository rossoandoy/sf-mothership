import type { PageContext } from '@/types/context';

const PAGE_TYPE_LABELS: Record<string, string> = {
  recordPage: 'レコードページ',
  objectHome: 'オブジェクトホーム',
  setupPage: 'Setup',
  other: 'その他',
};

interface ContextCardProps {
  context: PageContext | null;
}

export function ContextCard({ context }: ContextCardProps) {
  if (!context) {
    return (
      <section className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">コンテキスト</p>
        <p className="text-sm text-gray-400 mt-1">Salesforceページに移動してください</p>
      </section>
    );
  }

  return (
    <section className="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <p className="text-xs text-gray-500 mb-2">コンテキスト</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-16 shrink-0">Org</span>
          <span className="text-xs text-gray-700 truncate">{context.orgDomain}</span>
          {context.isSandboxDomain && (
            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
              Sandbox
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-16 shrink-0">画面</span>
          <span className="text-xs text-gray-700">
            {PAGE_TYPE_LABELS[context.pageType] ?? context.pageType}
          </span>
        </div>
        {context.objectApiName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-16 shrink-0">Object</span>
            <span className="text-xs font-mono text-blue-700">{context.objectApiName}</span>
          </div>
        )}
        {context.recordId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-16 shrink-0">Record</span>
            <span className="text-xs font-mono text-blue-700">{context.recordId}</span>
          </div>
        )}
      </div>
    </section>
  );
}
