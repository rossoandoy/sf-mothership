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
      authorizationToken: 'Bearer bad',
      nested: { token: 'bad', sid: 'bad-sid', label: 'ok' },
    });
    expect(sanitized['objectName']).toBe('Account');
    expect(sanitized['sessionId']).toBeUndefined();
    expect(sanitized['authorizationToken']).toBeUndefined();
    expect((sanitized['nested'] as Record<string, unknown>)['token']).toBeUndefined();
    expect((sanitized['nested'] as Record<string, unknown>)['sid']).toBeUndefined();
    expect((sanitized['nested'] as Record<string, unknown>)['label']).toBe('ok');
  });

  it('配列内のオブジェクトからも禁止キーを除去する', () => {
    const sanitized = sanitizePayload({
      fields: [
        { name: 'Name', token: 'bad' },
        { label: 'Owner', password: 'bad', nested: { authorization: 'Bearer bad', type: 'reference' } },
      ],
    });

    const fields = sanitized['fields'] as Array<Record<string, unknown>>;
    const first = fields[0];
    const second = fields[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first?.['name']).toBe('Name');
    expect(first?.['token']).toBeUndefined();
    expect(second?.['password']).toBeUndefined();
    expect((second?.['nested'] as Record<string, unknown>)['authorization']).toBeUndefined();
    expect((second?.['nested'] as Record<string, unknown>)['type']).toBe('reference');
  });
});
