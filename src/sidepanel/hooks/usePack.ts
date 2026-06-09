import { useEffect, useState } from 'react';
import type { PackData } from '@/types/pack';
import { getActivePack, loadPack } from '@/packs/packLoader';
import { setGuides } from '@/tools/builtins/uatGuide';
import { applyPackTools } from '@/runtime/packRegistry';
import { clearTabPanelCache } from './useTabPanel';
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
  setGuides(data.guides);
  applyPackTools(data.tools);
  clearTabPanelCache();
}
