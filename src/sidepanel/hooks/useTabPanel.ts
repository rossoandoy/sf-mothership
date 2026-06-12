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

export type TabPanelStatus = 'idle' | 'loading' | 'partial' | 'ready' | 'error' | 'empty';

export interface TabPanelState {
  status: TabPanelStatus;
  results: TabPanelResult[];
  error: string | null;
  pendingToolIds: string[];
}

const INITIAL_STATE: TabPanelState = {
  status: 'idle',
  results: [],
  error: null,
  pendingToolIds: [],
};

interface TabPanelCacheEntry {
  state: TabPanelState;
  cachedAt: number;
}

export const TAB_PANEL_CACHE_TTL_MS = 5 * 60 * 1000;

const tabPanelCache = new Map<string, TabPanelCacheEntry>();

export function buildTabPanelCacheKey(tabId: ContextTabId, context: PageContext): string {
  return [
    tabId,
    context.orgDomain,
    context.pageType,
    context.objectApiName ?? '',
    context.recordId ?? '',
    context.url,
  ].join('|');
}

export function createLoadingTabPanelState(toolIds: string[]): TabPanelState {
  return {
    status: 'loading',
    results: [],
    error: null,
    pendingToolIds: [...toolIds],
  };
}

export function isTabPanelCacheFresh(
  entry: Pick<TabPanelCacheEntry, 'cachedAt'>,
  now = Date.now(),
  ttlMs = TAB_PANEL_CACHE_TTL_MS
): boolean {
  return now - entry.cachedAt <= ttlMs;
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
      setState({ status: 'empty', results: [], error: null, pendingToolIds: [] });
      return;
    }

    const cacheKey = buildTabPanelCacheKey(tabId, pageContext);
    const cached = tabPanelCache.get(cacheKey);
    if (cached && cached.state.status === 'ready' && isTabPanelCacheFresh(cached)) {
      setState(cached.state);
      return;
    }

    const requestId = ++requestIdRef.current;
    setState(createLoadingTabPanelState(toolIds));

    (async () => {
      const results: TabPanelResult[] = [];
      const pending = new Set(toolIds);
      let firstError: string | null = null;

      await Promise.all(
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

          if (requestId !== requestIdRef.current) return;

          pending.delete(toolId);
          if (execResult.ok) {
            results.push({ toolId, result: execResult.data });
          } else if (!firstError) {
            firstError = execResult.error;
          }

          const pendingToolIds = toolIds.filter((id) => pending.has(id));
          const status: TabPanelStatus = pendingToolIds.length > 0
            ? (results.length > 0 ? 'partial' : 'loading')
            : (results.length > 0 ? 'ready' : 'error');
          const nextState: TabPanelState = {
            status,
            results: [...results],
            error: status === 'error'
              ? firstError ?? 'データを取得できませんでした'
              : firstError,
            pendingToolIds,
          };

          if (status === 'ready') {
            tabPanelCache.set(cacheKey, {
              state: nextState,
              cachedAt: Date.now(),
            });
          }

          setState(nextState);
        })
      );
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
