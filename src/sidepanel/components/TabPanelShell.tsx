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
  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="text-xs text-gray-500 ml-2">読み込み中...</span>
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
