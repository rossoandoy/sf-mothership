import { describe, it, expect } from 'vitest';
import { resolveTemplate, resolveSOQLTemplate } from './templateEngine';
import type { TemplateScope } from './templateEngine';
import type { PageContext } from '@/types/context';

const baseContext: PageContext = {
  orgDomain: 'test.lightning.force.com',
  objectApiName: 'Account',
  recordId: '001xx000003DGbQAAW',
  pageType: 'recordPage',
  url: 'https://test.lightning.force.com/lightning/r/Account/001xx000003DGbQAAW/view',
  isSandboxDomain: false,
  timestamp: Date.now(),
};

const scope: TemplateScope = {
  context: baseContext,
  inputs: { name: 'テスト' },
  steps: {
    q1: { records: [{ Name: '田中太郎', Id: '001xx000003DGbQAAW' }] },
  },
};

describe('resolveTemplate', () => {
  it('context 変数を展開する', () => {
    const result = resolveTemplate('{{context.objectApiName}}', scope);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe('Account');
  });

  it('steps 変数を展開する', () => {
    const result = resolveTemplate('{{steps.q1.records.0.Name}}', scope);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe('田中太郎');
  });

  it('inputs 変数を展開する', () => {
    const result = resolveTemplate('{{inputs.name}}', scope);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe('テスト');
  });
});

describe('resolveSOQLTemplate', () => {
  it('有効な recordId で SOQL を展開する', () => {
    const result = resolveSOQLTemplate(
      "SELECT Id FROM {{context.objectApiName}} WHERE Id = '{{context.recordId}}'",
      scope
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toContain('Account');
      expect(result.data).toContain('001xx000003DGbQAAW');
    }
  });
});
