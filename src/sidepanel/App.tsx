import { useEffect, useMemo, useRef, useState } from 'react';
import { usePageContext } from './hooks/usePageContext';
import { useOrgInfo } from './hooks/useOrgInfo';
import { useToolExecution } from './hooks/useToolExecution';
import { ContextBar } from './components/ContextBar';
import { ContextTabs } from './components/ContextTabs';
import { AdvancedDrawer } from './components/AdvancedDrawer';
import { ToolPanel } from './components/ToolPanel';
import { getDrawerTools } from '@/runtime/toolRegistry';
import { registerBuiltinTools } from '@/tools/builtins';
import { usePack } from './hooks/usePack';
import { useAiToolsEnabled } from './hooks/useAiToolsEnabled';
import { APP_VERSION } from '@/shared/version';
import type { ContextTabId } from '@/shared/tabTools';
import { useExtensionStatus } from './hooks/useExtensionStale';
import { ExtensionStaleBanner } from './components/ExtensionStaleBanner';
import { buildContextIdentity } from './contextIdentity';

registerBuiltinTools();

export function App() {
  const pageContextState = usePageContext();
  const context = pageContextState.context;
  const extensionStatus = useExtensionStatus(context, pageContextState.error);
  const orgInfo = useOrgInfo(context);
  const activePackId = usePack();
  const aiToolsEnabled = useAiToolsEnabled();
  const [activeTab, setActiveTab] = useState<ContextTabId>('instant');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const previousContextIdentityRef = useRef<string | null>(null);

  const { state, selectTool, executeTool, confirmExecution, reset, goBack } = useToolExecution({
    pageContext: context,
    orgInfo,
  });

  const drawerTools = useMemo(() => {
    if (!context) return [];
    return getDrawerTools(context, orgInfo, { aiToolsEnabled });
  }, [context, orgInfo, aiToolsEnabled]);

  const inToolFlow = state.phase !== 'idle';
  const contextIdentity = useMemo(() => buildContextIdentity(context), [context]);
  const showStatusBanner = extensionStatus !== 'ready' && extensionStatus !== 'checking';

  useEffect(() => {
    if (!contextIdentity) return;

    if (
      previousContextIdentityRef.current &&
      previousContextIdentityRef.current !== contextIdentity
    ) {
      setActiveTab('instant');
    }

    previousContextIdentityRef.current = contextIdentity;
  }, [contextIdentity]);

  return (
    <div className="relative flex flex-col h-screen">
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2 shadow-sm shrink-0">
        <span className="text-lg font-bold">SF Mothership</span>
        <span className="text-xs opacity-75">v{APP_VERSION}</span>
        {orgInfo && (
          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
            orgInfo.isSandbox ? 'bg-yellow-400 text-yellow-900' : 'bg-red-400 text-red-900'
          }`}>
            {orgInfo.isSandbox ? 'Sandbox' : 'Production'}
          </span>
        )}
      </header>

      <ContextBar context={context} />
      {showStatusBanner && (
        <ExtensionStaleBanner
          status={extensionStatus}
          onRetry={pageContextState.retry}
        />
      )}

      <main className="flex-1 flex flex-col min-h-0">
        {inToolFlow ? (
          <div className="flex-1 overflow-y-auto px-4 py-3">
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
          </div>
        ) : (
          showStatusBanner && !context ? (
            <div className="flex-1 px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-700">ページ文脈を取得できません</p>
              <p className="text-xs text-gray-500 mt-2">
                上の案内に従って再取得、または Salesforce タブを再読み込みしてください。
              </p>
            </div>
          ) : (
            <ContextTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              pageContext={context}
              orgInfo={orgInfo}
            />
          )
        )}
      </main>

      {!inToolFlow && (
        <footer className="px-4 py-2 border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400">Pack: {activePackId}</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            もっと見る
          </button>
        </footer>
      )}

      <AdvancedDrawer
        open={drawerOpen && !inToolFlow}
        tools={drawerTools}
        onSelect={selectTool}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
