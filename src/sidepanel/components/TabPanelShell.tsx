import type { TabPanelState } from '../hooks/useTabPanel';
import { LoadingSpinner } from './LoadingSpinner';

interface TabPanelShellProps {
  state: TabPanelState;
  emptyMessage: string;
  children: React.ReactNode;
}

export function TabPanelShell({
  state,
  emptyMessage,
  children,
}: TabPanelShellProps) {
  const isLoadingLike = state.status === 'idle' || state.status === 'loading' || state.status === 'partial';

  if (isLoadingLike && state.results.length === 0) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="divide-y divide-gray-100">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="px-3 py-2 flex items-center gap-3">
                <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 flex-1 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <LoadingSpinner />
          <span className="ml-2">概要を取得しています...</span>
        </div>
      </div>
    );
  }

  if (isLoadingLike && state.results.length > 0) {
    return (
      <div className="space-y-2" aria-busy="true">
        {children}
        {state.pendingToolIds.length > 0 && (
          <p className="text-xs text-gray-500">
            残り {state.pendingToolIds.length} 件を取得中...
          </p>
        )}
      </div>
    );
  }

  if (state.status === 'empty') {
    return (
      <p className="text-xs text-gray-400 py-6 text-center">{emptyMessage}</p>
    );
  }

  if (state.status === 'error' && state.results.length === 0) {
    return (
      <div className="py-4 px-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-xs text-red-700">{state.error ?? 'エラーが発生しました'}</p>
      </div>
    );
  }

  return <>{children}</>;
}
