import { logger } from '@/shared/logger';

const LOG_STORAGE_KEY = 'execution_log';
const MAX_LOG_ENTRIES = 20;

export interface ExecutionLogEntry {
  timestamp: number;
  toolId: string;
  orgDomain: string;
  objectApiName: string | null;
  success: boolean;
  durationMs: number;
  error?: string;
}

/**
 * ツール実行ログを記録する（直近20件）
 * セッションIDや個人データは絶対に含めない
 */
export async function logExecution(entry: ExecutionLogEntry): Promise<void> {
  try {
    const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const logs = (result[LOG_STORAGE_KEY] as ExecutionLogEntry[] | undefined) ?? [];

    logs.unshift(entry);

    // 最大件数を超えたら古いものを削除
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.length = MAX_LOG_ENTRIES;
    }

    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: logs });
  } catch (e: unknown) {
    logger.warn('実行ログの保存に失敗', e);
  }
}

/**
 * 実行ログを取得する
 */
export async function getExecutionLogs(): Promise<ExecutionLogEntry[]> {
  try {
    const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
    return (result[LOG_STORAGE_KEY] as ExecutionLogEntry[] | undefined) ?? [];
  } catch {
    return [];
  }
}
