import { useState, useCallback } from 'react';
import type { ToolDefinition, ToolResult, ToolExecutionContext } from '@/types/tool';
import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import { checkSafety } from '@/runtime/safetyGuard';
import { executeTool as runTool } from '@/runtime/toolExecutor';

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

  const executeTool = useCallback(async (
    tool: ToolDefinition,
    inputs: Record<string, string>,
    options?: { confirmed?: boolean; isDryRun?: boolean }
  ) => {
    if (!pageContext || !orgInfo) return;

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

    const ctx: ToolExecutionContext = {
      pageContext,
      orgInfo,
      inputs,
      isDryRun: options?.isDryRun ?? false,
    };

    // confirm が必要で未確認の場合
    if (safety.requiresConfirm && !options?.confirmed) {
      if (safety.supportsDryRun) {
        setState({ phase: 'loading', tool });
        const dryRunResult = await runTool({
          toolId: tool.id,
          context: { ...ctx, isDryRun: true },
          confirmed: true,
        });
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

    setState({ phase: 'loading', tool });

    try {
      const result = await runTool({
        toolId: tool.id,
        context: ctx,
        confirmed: options?.confirmed ?? false,
      });

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

  const selectTool = useCallback((tool: ToolDefinition) => {
    if (tool.inputs.length > 0) {
      setState({ phase: 'inputting', tool });
    } else {
      executeTool(tool, {});
    }
  }, [executeTool]);

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
