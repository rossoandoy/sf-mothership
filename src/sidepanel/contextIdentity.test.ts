import { describe, expect, it } from 'vitest';
import { buildContextIdentity } from './contextIdentity';
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

describe('buildContextIdentity', () => {
  it('recordId の変更を区別する', () => {
    expect(buildContextIdentity(baseContext)).not.toBe(buildContextIdentity({
      ...baseContext,
      recordId: '001xx000003DGbQBBB',
      url: 'https://test.lightning.force.com/lightning/r/Account/001xx000003DGbQBBB/view',
    }));
  });

  it('objectApiName の変更を区別する', () => {
    expect(buildContextIdentity(baseContext)).not.toBe(buildContextIdentity({
      ...baseContext,
      objectApiName: 'Contact',
      recordId: '003xx000004TmiAAAS',
      url: 'https://test.lightning.force.com/lightning/r/Contact/003xx000004TmiAAAS/view',
    }));
  });

  it('objectHome の URL 変更を区別する', () => {
    const recentList = {
      ...baseContext,
      pageType: 'objectHome' as const,
      recordId: null,
      url: 'https://test.lightning.force.com/lightning/o/Account/list?filterName=Recent',
    };
    const allList = {
      ...recentList,
      url: 'https://test.lightning.force.com/lightning/o/Account/list?filterName=AllAccounts',
    };

    expect(buildContextIdentity(recentList)).not.toBe(buildContextIdentity(allList));
  });
});
