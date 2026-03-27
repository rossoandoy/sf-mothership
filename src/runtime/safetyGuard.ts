import type { ToolDefinition } from '@/types/tool';
import type { OrgInfo } from '@/types/salesforce';
import type { Result } from '@/shared/result';
import { ok } from '@/shared/result';

export interface SafetyCheckResult {
  canExecute: boolean;
  requiresConfirm: boolean;
  supportsDryRun: boolean;
  reason?: string;
}

/**
 * ツール実行前の安全性チェック
 */
export function checkSafety(
  definition: ToolDefinition,
  orgInfo: OrgInfo,
  affectedCount?: number
): Result<SafetyCheckResult> {
  const { safety } = definition;

  // Production環境でallowInProd=falseのツール
  if (!orgInfo.isSandbox && !safety.allowInProd) {
    return ok({
      canExecute: false,
      requiresConfirm: false,
      supportsDryRun: false,
      reason: `このツール「${definition.title}」はProduction環境では使用できません。Sandbox環境で実行してください。`,
    });
  }

  // maxAffectedRecordsチェック
  if (
    safety.maxAffectedRecords > 0 &&
    affectedCount != null &&
    affectedCount > safety.maxAffectedRecords
  ) {
    return ok({
      canExecute: false,
      requiresConfirm: false,
      supportsDryRun: false,
      reason: `影響レコード数(${affectedCount}件)が上限(${safety.maxAffectedRecords}件)を超えています。`,
    });
  }

  return ok({
    canExecute: true,
    requiresConfirm: safety.requireConfirm,
    supportsDryRun: safety.dryRunSupported,
  });
}
