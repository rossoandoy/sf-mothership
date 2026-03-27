import type { PageContext } from '@/types/context';
import { logger } from '@/shared/logger';

// タブごとのPageContextを管理
const tabContexts = new Map<number, PageContext>();

export function updateTabContext(tabId: number, context: PageContext): void {
  tabContexts.set(tabId, context);
  logger.debug('コンテキスト更新', { tabId, pageType: context.pageType, object: context.objectApiName });
}

export function getTabContext(tabId: number): PageContext | null {
  return tabContexts.get(tabId) ?? null;
}

export function removeTabContext(tabId: number): void {
  tabContexts.delete(tabId);
}

/**
 * 現在アクティブなタブのコンテキストを取得する
 */
export async function getActiveTabContext(): Promise<PageContext | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    return getTabContext(tab.id);
  } catch {
    logger.warn('アクティブタブの取得に失敗');
    return null;
  }
}

// タブが閉じられたらクリーンアップ
chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabContext(tabId);
});
