import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildTabPanelCacheKey,
  createLoadingTabPanelState,
  clearTabPanelCache,
  isTabPanelCacheFresh,
} from './useTabPanel';
import type { PageContext } from '@/types/context';

const baseContext: PageContext = {
  orgDomain: 'test.lightning.force.com',
  objectApiName: 'Account',
  recordId: '001xx000003DGbQAAW',
  pageType: 'recordPage',
  url: 'https://test.lightning.force.com/lightning/r/Account/001xx000003DGbQAAW/view',
  isSandboxDomain: true,
  timestamp: 1,
};

describe('useTabPanel cache', () => {
  beforeEach(() => {
    clearTabPanelCache();
  });

  it('キャッシュキーが文脈ごとに異なる', () => {
    const key1 = buildTabPanelCacheKey('instant', baseContext);
    const key2 = buildTabPanelCacheKey('instant', {
      ...baseContext,
      recordId: '001xx000003DGbQBBB',
    });
    expect(key1).not.toBe(key2);
  });

  it('タブごとにキーが異なる', () => {
    const instant = buildTabPanelCacheKey('instant', baseContext);
    const fields = buildTabPanelCacheKey('fields', baseContext);
    expect(instant).not.toBe(fields);
  });

  it('URL が違う objectHome を別キャッシュとして扱う', () => {
    const listA = buildTabPanelCacheKey('instant', {
      ...baseContext,
      pageType: 'objectHome',
      recordId: null,
      url: 'https://test.lightning.force.com/lightning/o/Account/list?filterName=Recent',
    });
    const listB = buildTabPanelCacheKey('instant', {
      ...baseContext,
      pageType: 'objectHome',
      recordId: null,
      url: 'https://test.lightning.force.com/lightning/o/Account/list?filterName=AllAccounts',
    });

    expect(listA).not.toBe(listB);
  });

  it('loading state は pendingToolIds を持つ', () => {
    const state = createLoadingTabPanelState(['quick-record-viewer', 'access-diagnostic']);

    expect(state.status).toBe('loading');
    expect(state.pendingToolIds).toEqual(['quick-record-viewer', 'access-diagnostic']);
    expect(state.results).toEqual([]);
  });

  it('TTL 内のキャッシュだけ fresh と判定する', () => {
    expect(isTabPanelCacheFresh({ cachedAt: 1_000 }, 2_000, 2_000)).toBe(true);
    expect(isTabPanelCacheFresh({ cachedAt: 1_000 }, 4_001, 2_000)).toBe(false);
  });

  it('clearTabPanelCache が呼べる', () => {
    clearTabPanelCache();
    expect(true).toBe(true);
  });
});
