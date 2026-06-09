import { describe, it, expect } from 'vitest';
import { buildSafeContext, sanitizePayload } from './appServerSafety';
import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';

const pageContext: PageContext = {
  orgDomain: 'test.lightning.force.com',
  objectApiName: 'Account',
  recordId: '001xx000003DGbQAAW',
  pageType: 'recordPage',
  url: 'https://test.lightning.force.com/',
  isSandboxDomain: true,
  timestamp: Date.now(),
};

const orgInfo: OrgInfo = {
  id: '00D',
  name: 'Test Org',
  isSandbox: true,
  organizationType: 'Developer Edition',
};

describe('appServerSafety', () => {
  it('安全なコンテキストを構築する', () => {
    const ctx = buildSafeContext(pageContext, orgInfo);
    expect(ctx.orgDomain).toBe('test.lightning.force.com');
    expect(ctx.isSandbox).toBe(true);
    expect('sessionId' in ctx).toBe(false);
  });

  it('禁止キーを除去する', () => {
    const sanitized = sanitizePayload({
      objectName: 'Account',
      sessionId: 'secret',
      nested: { token: 'bad', label: 'ok' },
    });
    expect(sanitized['objectName']).toBe('Account');
    expect(sanitized['sessionId']).toBeUndefined();
    expect((sanitized['nested'] as Record<string, unknown>)['token']).toBeUndefined();
    expect((sanitized['nested'] as Record<string, unknown>)['label']).toBe('ok');
  });
});
