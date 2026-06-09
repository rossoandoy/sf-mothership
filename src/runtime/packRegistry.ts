import { registerDeclarativeTool, unregisterTool } from './toolRegistry';
import type { ToolDefinition } from '@/types/tool';
import { logger } from '@/shared/logger';

/** 現在登録中の Pack 由来ツール ID */
let activePackToolIds: string[] = [];

/**
 * Pack 由来の宣言的ツールを登録する。
 * 前回登録分は先に解除する。
 */
export function applyPackTools(tools: ToolDefinition[]): void {
  for (const id of activePackToolIds) {
    unregisterTool(id);
  }
  activePackToolIds = [];

  for (const toolDef of tools) {
    try {
      registerDeclarativeTool(toolDef);
      activePackToolIds.push(toolDef.id);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      logger.warn(`宣言的ツール登録失敗: ${toolDef.id}`, message);
    }
  }

  if (tools.length > 0) {
    logger.info(`Pack宣言的ツール登録: ${tools.length}件`);
  }
}

/** テスト用: 登録中の Pack ツール ID を取得 */
export function getActivePackToolIds(): readonly string[] {
  return activePackToolIds;
}

/** テスト用: 状態をリセット */
export function resetPackRegistry(): void {
  for (const id of activePackToolIds) {
    unregisterTool(id);
  }
  activePackToolIds = [];
}
