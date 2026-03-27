import type { PackData } from '@/types/pack';
import type { ToolDefinition } from '@/types/tool';
import type { GuideEntry } from '@/tools/builtins/uatGuide';
import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import { logger } from '@/shared/logger';

// ビルド時に同梱されるPack JSONをimportする
import defaultGuides from './default/guides.json';
import defaultTools from './default/tools.json';
import manabieGuides from './manabie/guides.json';
import manabieTools from './manabie/tools.json';

const ACTIVE_PACK_KEY = 'active_pack';

const packDataMap: Record<string, PackData> = {
  default: {
    guides: defaultGuides.guides as GuideEntry[],
    tools: (defaultTools.tools ?? []) as ToolDefinition[],
  },
  manabie: {
    guides: manabieGuides.guides as GuideEntry[],
    tools: (manabieTools.tools ?? []) as ToolDefinition[],
  },
};

/**
 * 指定されたPackのデータを読み込む
 */
export function loadPack(packId: string): Result<PackData> {
  const data = packDataMap[packId];
  if (!data) {
    return err(`Pack "${packId}" が見つかりません`);
  }
  logger.info(`Pack読み込み: ${packId} (ガイド ${data.guides.length}件, ツール ${data.tools.length}件)`);
  return ok(data);
}

/**
 * 現在アクティブなPackのIDを取得する
 */
export async function getActivePack(): Promise<string> {
  try {
    const result = await chrome.storage.local.get(ACTIVE_PACK_KEY);
    return (result[ACTIVE_PACK_KEY] as string | undefined) ?? 'default';
  } catch {
    return 'default';
  }
}

/**
 * アクティブなPackを切り替える
 */
export async function setActivePack(packId: string): Promise<void> {
  await chrome.storage.local.set({ [ACTIVE_PACK_KEY]: packId });
  logger.info(`Pack切替: ${packId}`);
}
