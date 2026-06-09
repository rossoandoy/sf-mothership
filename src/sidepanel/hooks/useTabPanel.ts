import { useState, useEffect, useRef } from 'react';
import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import type { ToolResult } from '@/types/tool';
import { executeTool as runTool } from '@/runtime/toolExecutor';
import { getToolIdsForTab, type ContextTabId } from '@/shared/tabTools';

export interface TabPanelResult {
  toolId: string;
  result: ToolResult;
}

export type TabPanelStatus = 'idle' | 'loading' | 'ready' | 'error' | 'empty';

export interface TabPanelState {
  status: TabPanelStatus;
  results: TabPanelResult[];
  error: string | null;
}

const INITIAL_STATE: TabPanelState = {
  status: 'idle',
  results: [],
  error: null,
};

const tabPanelCache = new Map<string, TabPanelState>();

export function buildTabPanelCacheKey(tabId: ContextTabId, context: PageContext): string {
  return [
    tabId,
    context.orgDomain,
    context.pageType,
    context.objectApiName ?? '',
    context.recordId ?? '',
  ].join('|');
}

export function clearTabPanelCache(): void {
  tabPanelCache.clear();
}

/**
 * タブがアクティブなとき、紐づくツールを自動実行する（キャッシュ + 並列実行）
 */
export function useTabPanel(
  tabId: ContextTabId,
  pageContext: PageContext | null,
  orgInfo: OrgInfo | null,
  active: boolean
): TabPanelState {
  const [state, setState] = useState<TabPanelState>(INITIAL_STATE);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!active || !pageContext || !orgInfo) {
      return;
    }

    const toolIds = getToolIdsForTab(tabId, pageContext.pageType);
    if (toolIds.length === 0) {
      setState({ status: 'empty', results: [], error: null });
      return;
    }

    const cacheKey = buildTabPanelCacheKey(tabId, pageContext);
    const cached = tabPanelCache.get(cacheKey);
    if (cached && (cached.status === 'ready' || cached.status === 'error')) {
      setState(cached);
      return;
    }

    const requestId = ++requestIdRef.current;
    setState({ status: 'loading', results: [], error: null });

    (async () => {
      const execResults = await Promise.all(
        toolIds.map(async (toolId) => {
          const execResult = await runTool({
            toolId,
            context: {
              pageContext,
              orgInfo,
              inputs: {},
              isDryRun: false,
            },
            confirmed: false,
          });
          return { toolId, execResult };
        })
      );

      if (requestId !== requestIdRef.current) return;

      const results: TabPanelResult[] = [];
      let firstError: string | null = null;

      for (const { toolId, execResult } of execResults) {
        if (execResult.ok) {
          results.push({ toolId, result: execResult.data });
        } else if (!firstError) {
          firstError = execResult.error;
        }
      }

      let finalState: TabPanelState;
      if (results.length > 0) {
        finalState = { status: 'ready', results, error: firstError };
      } else {
        finalState = {
          status: 'error',
          results: [],
          error: firstError ?? 'データを取得できませんでした',
        };
      }

      tabPanelCache.set(cacheKey, finalState);
      setState(finalState);
    })();
  }, [
    tabId,
    active,
    pageContext?.orgDomain,
    pageContext?.pageType,
    pageContext?.objectApiName,
    pageContext?.recordId,
    pageContext?.timestamp,
    orgInfo,
  ]);

  return state;
}
