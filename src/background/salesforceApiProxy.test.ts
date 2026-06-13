import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleSalesforceApiRequest, type SalesforceApiProxyDeps } from './salesforceApiProxy';

function buildDeps(): SalesforceApiProxyDeps {
  return {
    getSessionId: vi.fn(async () => ({
      ok: true,
      data: {
        sessionId: '00D-session',
        apiHostname: 'example.my.salesforce.com',
      },
    } as const)),
    query: vi.fn(async () => ({ ok: true, data: { totalSize: 1, done: true, records: [] } } as const)),
    describeObject: vi.fn(async () => ({ ok: true, data: {
      name: 'Account',
      label: 'Account',
      labelPlural: 'Accounts',
      keyPrefix: '001',
      custom: false,
      createable: true,
      deletable: true,
      updateable: true,
      queryable: true,
      fields: [],
      childRelationships: [],
      recordTypeInfos: [],
    } } as const)),
    getOrgInfo: vi.fn(async () => ({ ok: true, data: { id: '00D', name: 'Org', isSandbox: true, organizationType: 'Developer Edition' } } as const)),
    sfFetch: vi.fn(async () => ({ ok: true, data: { ok: true } } as const)),
  };
}

describe('handleSalesforceApiRequest', () => {
  let deps: SalesforceApiProxyDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('query action は session 取得後に SOQL query を呼ぶ', async () => {
    const result = await handleSalesforceApiRequest({
      domain: 'example.lightning.force.com',
      action: 'query',
      params: { soql: 'SELECT Id FROM Account' },
    }, deps);

    expect(result.ok).toBe(true);
    expect(deps.getSessionId).toHaveBeenCalledWith('example.lightning.force.com');
    expect(deps.query).toHaveBeenCalledWith(
      'example.my.salesforce.com',
      '00D-session',
      'SELECT Id FROM Account'
    );
  });

  it('describe action は describeObject を呼ぶ', async () => {
    await handleSalesforceApiRequest({
      domain: 'example.lightning.force.com',
      action: 'describe',
      params: { objectApiName: 'Account' },
    }, deps);

    expect(deps.describeObject).toHaveBeenCalledWith(
      'example.my.salesforce.com',
      '00D-session',
      'Account'
    );
  });

  it('必須 params 不足は API 呼び出し前に error にする', async () => {
    const result = await handleSalesforceApiRequest({
      domain: 'example.lightning.force.com',
      action: 'query',
      params: {},
    }, deps);

    expect(result).toEqual({ ok: false, error: 'soql は必須です' });
    expect(deps.getSessionId).not.toHaveBeenCalled();
    expect(deps.query).not.toHaveBeenCalled();
  });

  it('unknown action は error にする', async () => {
    const result = await handleSalesforceApiRequest({
      domain: 'example.lightning.force.com',
      action: 'unknown' as never,
      params: {},
    }, deps);

    expect(result).toEqual({ ok: false, error: '未知のAPIアクション: unknown' });
  });

  it('session 取得失敗はそのまま返す', async () => {
    deps.getSessionId = vi.fn(async () => ({ ok: false, error: 'ログインしていません' } as const));

    const result = await handleSalesforceApiRequest({
      domain: 'example.lightning.force.com',
      action: 'orgInfo',
      params: {},
    }, deps);

    expect(result).toEqual({ ok: false, error: 'ログインしていません' });
    expect(deps.getOrgInfo).not.toHaveBeenCalled();
  });
});
