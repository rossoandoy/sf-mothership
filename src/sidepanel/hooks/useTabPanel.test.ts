import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildTabPanelCacheKey,
  clearTabPanelCache,
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

  it('clearTabPanelCache が呼べる', () => {
    clearTabPanelCache();
    expect(true).toBe(true);
  });
});
