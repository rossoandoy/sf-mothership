import { useState, useCallback } from 'react';
import type { ToolDefinition, ToolResult, ToolExecutionContext } from '@/types/tool';
import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import { getToolById } from '@/runtime/toolRegistry';
import { checkSafety } from '@/runtime/safetyGuard';

export type ToolExecutionState =
  | { phase: 'idle' }
  | { phase: 'inputting'; tool: ToolDefinition }
  | { phase: 'loading'; tool: ToolDefinition }
  | { phase: 'confirm'; tool: ToolDefinition; inputs: Record<string, string>; dryRunResult?: ToolResult }
  | { phase: 'result'; tool: ToolDefinition; result: ToolResult }
  | { phase: 'error'; tool: ToolDefinition; error: string };

interface UseToolExecutionOptions {
  pageContext: PageContext | null;
  orgInfo: OrgInfo | null;
}

export function useToolExecution({ pageContext, orgInfo }: UseToolExecutionOptions) {
  const [state, setState] = useState<ToolExecutionState>({ phase: 'idle' });

  const selectTool = useCallback((tool: ToolDefinition) => {
    if (tool.inputs.length > 0) {
      setState({ phase: 'inputting', tool });
    } else {
      // 入力不要なら直接実行
      executeTool(tool, {});
    }
  }, [pageContext, orgInfo]);

  const executeTool = useCallback(async (
    tool: ToolDefinition,
    inputs: Record<string, string>,
    options?: { confirmed?: boolean; isDryRun?: boolean }
  ) => {
    if (!pageContext || !orgInfo) return;

    const registered = getToolById(tool.id);
    if (!registered) {
      setState({ phase: 'error', tool, error: 'ツールが見つかりません' });
      return;
    }

    // SafetyCheck
    const safetyResult = checkSafety(tool, orgInfo);
    if (!safetyResult.ok) {
      setState({ phase: 'error', tool, error: safetyResult.error });
      return;
    }

    const safety = safetyResult.data;
    if (!safety.canExecute) {
      setState({ phase: 'error', tool, error: safety.reason ?? '実行できません' });
      return;
    }

    // confirmが必要でdryRunをまずやる
    if (safety.requiresConfirm && !options?.confirmed) {
      if (safety.supportsDryRun) {
        setState({ phase: 'loading', tool });
        const ctx: ToolExecutionContext = { pageContext, orgInfo, inputs, isDryRun: true };
        const dryRunResult = await registered.handler(ctx);
        if (dryRunResult.ok) {
          setState({ phase: 'confirm', tool, inputs, dryRunResult: dryRunResult.data });
        } else {
          setState({ phase: 'error', tool, error: dryRunResult.error });
        }
      } else {
        setState({ phase: 'confirm', tool, inputs });
      }
      return;
    }

    // 実行
    setState({ phase: 'loading', tool });
    const ctx: ToolExecutionContext = {
      pageContext,
      orgInfo,
      inputs,
      isDryRun: options?.isDryRun ?? false,
    };

    try {
      const result = await registered.handler(ctx);
      if (result.ok) {
        setState({ phase: 'result', tool, result: result.data });
      } else {
        setState({ phase: 'error', tool, error: result.error });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      setState({ phase: 'error', tool, error: message });
    }
  }, [pageContext, orgInfo]);

  const confirmExecution = useCallback(() => {
    if (state.phase !== 'confirm') return;
    executeTool(state.tool, state.inputs, { confirmed: true });
  }, [state, executeTool]);

  const reset = useCallback(() => {
    setState({ phase: 'idle' });
  }, []);

  const goBack = useCallback(() => {
    if (state.phase === 'idle') return;
    if ('tool' in state && state.tool.inputs.length > 0) {
      setState({ phase: 'inputting', tool: state.tool });
    } else {
      setState({ phase: 'idle' });
    }
  }, [state]);

  return {
    state,
    selectTool,
    executeTool,
    confirmExecution,
    reset,
    goBack,
  };
}
