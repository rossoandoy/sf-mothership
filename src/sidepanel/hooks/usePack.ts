import { useEffect, useState } from 'react';
import type { PackData } from '@/types/pack';
import { getActivePack, loadPack } from '@/packs/packLoader';
import { setGuides } from '@/tools/builtins/uatGuide';
import { registerDeclarativeTool } from '@/runtime/toolRegistry';
import { logger } from '@/shared/logger';

/**
 * アクティブなPackを読み込み、ガイドと宣言的ツールをセットするフック
 */
export function usePack(): string {
  const [activePackId, setActivePackId] = useState('default');

  useEffect(() => {
    loadActivePack();

    // storage変更を監視（Options画面でのPack切替を反映）
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes['active_pack']) {
        loadActivePack();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  async function loadActivePack() {
    const packId = await getActivePack();
    setActivePackId(packId);
    const result = loadPack(packId);
    if (result.ok) {
      applyPackData(result.data);
    } else {
      logger.warn('Pack読み込み失敗、デフォルトにフォールバック', result.error);
      const fallback = loadPack('default');
      if (fallback.ok) {
        applyPackData(fallback.data);
      }
    }
  }

  return activePackId;
}

function applyPackData(data: PackData) {
  // ガイドをセット
  setGuides(data.guides);

  // 宣言的ツールを登録（同じIDなら上書きされる）
  for (const toolDef of data.tools) {
    try {
      registerDeclarativeTool(toolDef);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      logger.warn(`宣言的ツール登録失敗: ${toolDef.id}`, message);
    }
  }

  if (data.tools.length > 0) {
    logger.info(`Pack宣言的ツール登録: ${data.tools.length}件`);
  }
}
