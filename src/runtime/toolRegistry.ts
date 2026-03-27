import type { ToolDefinition, ToolHandler } from '@/types/tool';
import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import { executeDeclarativeTool } from './declarativeEngine';
import { logger } from '@/shared/logger';

interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

const registry = new Map<string, RegisteredTool>();

/**
 * ツールを登録する
 */
export function registerTool(definition: ToolDefinition, handler: ToolHandler): void {
  if (registry.has(definition.id)) {
    logger.warn(`ツール "${definition.id}" は既に登録されています。上書きします。`);
  }
  registry.set(definition.id, { definition, handler });
  logger.debug(`ツール登録: ${definition.id}`);
}

/**
 * IDでツールを取得する
 */
export function getToolById(id: string): RegisteredTool | undefined {
  return registry.get(id);
}

/**
 * 現在のコンテキストに応じた利用可能なツール一覧を返す
 */
export function getAvailableTools(
  context: PageContext,
  orgInfo: OrgInfo | null
): ToolDefinition[] {
  const results: ToolDefinition[] = [];

  for (const { definition } of registry.values()) {
    // 無効なツールはスキップ
    if (!definition.enabled) continue;

    // production環境でallowInProd=falseのツールはスキップ
    if (orgInfo && !orgInfo.isSandbox && !definition.safety.allowInProd) continue;

    // pageMatchでフィルタ
    if (!definition.pageMatch.includes(context.pageType)) continue;

    // objectMatchでフィルタ（'*'は全オブジェクトにマッチ）
    if (
      context.objectApiName &&
      !definition.objectMatch.includes('*') &&
      !definition.objectMatch.includes(context.objectApiName)
    ) {
      continue;
    }

    results.push(definition);
  }

  return results;
}

/**
 * 宣言的ツール定義を登録する（JSONから読み込んだツール用）
 * ToolHandlerを自動生成し、declarativeEngineに委譲する
 */
export function registerDeclarativeTool(definition: ToolDefinition): void {
  const handler: ToolHandler = (ctx) => executeDeclarativeTool(definition, ctx);
  registerTool(definition, handler);
  logger.debug(`宣言的ツール登録: ${definition.id}`);
}

/**
 * 登録済み全ツールの定義を返す（管理用）
 */
export function getAllTools(): ToolDefinition[] {
  return Array.from(registry.values()).map(({ definition }) => definition);
}

/**
 * 指定IDのツールを登録解除する（Pack切替時に使用）
 */
export function unregisterTool(id: string): void {
  registry.delete(id);
}

/**
 * 全ツールを登録解除する（Pack再読込時に使用）
 */
export function clearRegistry(): void {
  registry.clear();
}
