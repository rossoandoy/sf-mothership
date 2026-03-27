import { useMemo } from 'react';
import { usePageContext } from './hooks/usePageContext';
import { useOrgInfo } from './hooks/useOrgInfo';
import { useToolExecution } from './hooks/useToolExecution';
import { ContextCard } from './components/ContextCard';
import { ToolList } from './components/ToolList';
import { ToolPanel } from './components/ToolPanel';
import { getAvailableTools } from '@/runtime/toolRegistry';
import { registerBuiltinTools } from '@/tools/builtins';
import { usePack } from './hooks/usePack';

// ビルトインツール登録（Side Panel読み込み時に一度だけ）
registerBuiltinTools();

export function App() {
  const context = usePageContext();
  const orgInfo = useOrgInfo(context);
  const activePackId = usePack();
  const { state, selectTool, executeTool, confirmExecution, reset, goBack } = useToolExecution({
    pageContext: context,
    orgInfo,
  });

  const availableTools = useMemo(() => {
    if (!context) return [];
    return getAvailableTools(context, orgInfo);
  }, [context, orgInfo]);

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2 shadow-sm">
        <span className="text-lg font-bold">SF Mothership</span>
        <span className="text-xs opacity-75">v0.1.0</span>
        {orgInfo && (
          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
            orgInfo.isSandbox ? 'bg-yellow-400 text-yellow-900' : 'bg-red-400 text-red-900'
          }`}>
            {orgInfo.isSandbox ? 'Sandbox' : 'Production'}
          </span>
        )}
      </header>

      {/* コンテキスト表示 */}
      <ContextCard context={context} />

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto px-4 py-3">
        {state.phase === 'idle' ? (
          <>
            <p className="text-xs text-gray-500 mb-2">
              利用可能なツール ({availableTools.length})
            </p>
            <ToolList tools={availableTools} onSelect={selectTool} />
          </>
        ) : (
          <ToolPanel
            state={state}
            onExecute={(inputs) => {
              if ('tool' in state) {
                executeTool(state.tool, inputs);
              }
            }}
            onConfirm={confirmExecution}
            onCancel={goBack}
            onBack={() => {
              if ('tool' in state && (state.phase === 'result' || state.phase === 'error')) {
                reset();
              } else {
                goBack();
              }
            }}
          />
        )}
      </main>

      {/* フッター */}
      <footer className="px-4 py-2 border-t border-gray-200 text-xs text-gray-400 text-center">
        SF Mothership &mdash; Pack: {activePackId}
      </footer>
    </div>
  );
}
