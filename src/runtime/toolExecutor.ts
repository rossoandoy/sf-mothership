import type { ToolExecutionContext, ToolResult } from '@/types/tool';
import type { Result } from '@/shared/result';
import { err } from '@/shared/result';
import { getToolById } from './toolRegistry';
import { checkSafety } from './safetyGuard';
import { logExecution } from './executionLogger';
import { logger } from '@/shared/logger';

export interface ExecuteToolOptions {
  toolId: string;
  context: ToolExecutionContext;
  /** ユーザーが確認済みかどうか（requireConfirm対応） */
  confirmed?: boolean;
}

/**
 * ツールを実行する
 *
 * 1. RegistryからツールをLookup
 * 2. SafetyGuardでチェック
 * 3. ハンドラを実行
 * 4. 実行ログを記録
 */
export async function executeTool(options: ExecuteToolOptions): Promise<Result<ToolResult>> {
  const { toolId, context, confirmed = false } = options;
  const startTime = Date.now();

  // 1. Registryから取得
  const registered = getToolById(toolId);
  if (!registered) {
    return err(`ツール "${toolId}" が見つかりません`);
  }

  const { definition, handler } = registered;

  // 2. SafetyGuardチェック
  const safetyResult = checkSafety(definition, context.orgInfo);
  if (!safetyResult.ok) {
    return err(safetyResult.error);
  }

  const safety = safetyResult.data;

  if (!safety.canExecute) {
    return err(safety.reason ?? 'このツールは現在実行できません');
  }

  // confirmが必要でまだ確認されていない場合
  if (safety.requiresConfirm && !confirmed && !context.isDryRun) {
    return err('CONFIRM_REQUIRED');
  }

  // 3. ハンドラ実行
  try {
    const result = await handler(context);
    const durationMs = Date.now() - startTime;

    // 4. ログ記録
    await logExecution({
      timestamp: Date.now(),
      toolId,
      orgDomain: context.pageContext.orgDomain,
      objectApiName: context.pageContext.objectApiName,
      success: result.ok,
      durationMs,
      error: result.ok ? undefined : result.error,
    });

    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    const durationMs = Date.now() - startTime;

    logger.error('ツール実行エラー', { toolId, error: message });

    await logExecution({
      timestamp: Date.now(),
      toolId,
      orgDomain: context.pageContext.orgDomain,
      objectApiName: context.pageContext.objectApiName,
      success: false,
      durationMs,
      error: message,
    });

    return err(`ツール実行エラー: ${message}`);
  }
}
