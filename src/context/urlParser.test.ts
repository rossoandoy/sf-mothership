import { describe, it, expect } from 'vitest';
import { parseUrl, isSalesforceUrl } from './urlParser';

describe('parseUrl', () => {
  it('レコードページを解析する', () => {
    const ctx = parseUrl(
      'https://mycompany.lightning.force.com/lightning/r/Account/001xx000003DGbQAAW/view'
    );
    expect(ctx.pageType).toBe('recordPage');
    expect(ctx.objectApiName).toBe('Account');
    expect(ctx.recordId).toBe('001xx000003DGbQAAW');
    expect(ctx.orgDomain).toBe('mycompany.lightning.force.com');
  });

  it('オブジェクトホームを解析する', () => {
    const ctx = parseUrl(
      'https://mycompany.lightning.force.com/lightning/o/Contact/list'
    );
    expect(ctx.pageType).toBe('objectHome');
    expect(ctx.objectApiName).toBe('Contact');
    expect(ctx.recordId).toBeNull();
  });

  it('sandbox ドメインを検出する', () => {
    const ctx = parseUrl(
      'https://mycompany--dev.sandbox.lightning.force.com/lightning/o/Account/home'
    );
    expect(ctx.isSandboxDomain).toBe(true);
  });

  it('setup 画面を解析する', () => {
    const ctx = parseUrl(
      'https://mycompany.lightning.force.com/lightning/setup/ObjectManager/home'
    );
    expect(ctx.pageType).toBe('setupPage');
  });
});

describe('isSalesforceUrl', () => {
  it('Salesforce URL を判定する', () => {
    expect(isSalesforceUrl('https://foo.salesforce.com/')).toBe(true);
    expect(isSalesforceUrl('https://foo.force.com/')).toBe(true);
    expect(isSalesforceUrl('https://google.com/')).toBe(false);
  });
});
